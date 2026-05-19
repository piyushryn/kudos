import cron from "node-cron";

import { invalidateAllKudosCaches } from "../cache/invalidations";
import { config } from "../config";
import { KudosEntryKind } from "../db/constants";
import { UserGivingBalanceModel, UserModel, KudosTransactionModel, ArchivedLeaderboardModel } from "../db/models";
import { logger } from "../logger";
import { getMonthYear } from "../utils/date";
import { effectiveQuotaForUser } from "../utils/balance-quota";

const jobLogger = logger.child({ job: "monthly-reset" });

const archiveCurrentMonthAndProvisionNext = async (): Promise<void> => {
  const startedAt = Date.now();
  const { month, year } = getMonthYear();

  jobLogger.info({ event: "monthly_reset_started", month, year }, "Monthly reset started.");

  jobLogger.debug(
    { event: "step1_aggregate_top_givers_begin", month, year },
    "Step 1a: aggregating top givers for current month.",
  );
  const topGiversRaw = await KudosTransactionModel.aggregate<{
    _id: unknown;
    points: number;
  }>([
    {
      $match: {
        month,
        year,
        kind: KudosEntryKind.KUDO,
        countsTowardTotals: true,
        isArchived: false,
      },
    },
    { $group: { _id: "$giverId", points: { $sum: "$points" } } },
    { $sort: { points: -1 } },
    { $limit: 10 },
  ]).exec();
  jobLogger.debug(
    { event: "step1_aggregate_top_givers_done", count: topGiversRaw.length },
    "Step 1a: top givers aggregated.",
  );

  jobLogger.debug(
    { event: "step1_aggregate_top_receivers_begin", month, year },
    "Step 1b: aggregating top receivers for current month.",
  );
  const topReceiversRaw = await KudosTransactionModel.aggregate<{
    _id: unknown;
    points: number;
  }>([
    {
      $match: {
        month,
        year,
        kind: KudosEntryKind.KUDO,
        countsTowardTotals: true,
        isArchived: false,
      },
    },
    { $group: { _id: "$receiverId", points: { $sum: "$points" } } },
    { $sort: { points: -1 } },
    { $limit: 10 },
  ]).exec();
  jobLogger.debug(
    { event: "step1_aggregate_top_receivers_done", count: topReceiversRaw.length },
    "Step 1b: top receivers aggregated.",
  );

  const userIds = [
    ...new Set([
      ...topGiversRaw.map((item) => item._id),
      ...topReceiversRaw.map((item) => item._id),
    ]),
  ];
  jobLogger.debug(
    { event: "step1_user_ids_collected", uniqueUserIds: userIds.length },
    "Step 1c: collected unique user ids for leaderboard.",
  );

  const usersMap = new Map();
  if (userIds.length > 0) {
    jobLogger.debug(
      { event: "step1_user_lookup_begin", count: userIds.length },
      "Step 1d: looking up user details.",
    );
    const users = await UserModel.find({ _id: { $in: userIds } }, { slackUserId: 1, displayName: 1 })
      .lean()
      .exec();
    users.forEach((user) => {
      usersMap.set(String(user._id), { slackUserId: user.slackUserId, displayName: user.displayName });
    });
    jobLogger.debug(
      { event: "step1_user_lookup_done", resolved: users.length },
      "Step 1d: user details resolved.",
    );
  } else {
    jobLogger.debug(
      { event: "step1_user_lookup_skipped" },
      "Step 1d: skipped user lookup (no participants).",
    );
  }

  const topGivers = topGiversRaw.map((item) => {
    const userInfo = usersMap.get(String(item._id)) || { slackUserId: "unknown", displayName: "Unknown" };
    return {
      userId: item._id,
      slackUserId: userInfo.slackUserId,
      displayName: userInfo.displayName,
      points: item.points,
    };
  });

  const topReceivers = topReceiversRaw.map((item) => {
    const userInfo = usersMap.get(String(item._id)) || { slackUserId: "unknown", displayName: "Unknown" };
    return {
      userId: item._id,
      slackUserId: userInfo.slackUserId,
      displayName: userInfo.displayName,
      points: item.points,
    };
  });

  jobLogger.info(
    {
      event: "step1_leaderboard_built",
      month,
      year,
      topGiversCount: topGivers.length,
      topReceiversCount: topReceivers.length,
    },
    "Step 1: final leaderboard built.",
  );

  jobLogger.debug(
    { event: "step2_archive_transactions_begin", month, year },
    "Step 2: archiving current month transactions.",
  );
  const archiveResult = await KudosTransactionModel.updateMany(
    { month, year, isArchived: false },
    { $set: { isArchived: true } },
  ).exec();
  jobLogger.info(
    {
      event: "step2_archive_transactions_done",
      month,
      year,
      matchedCount: archiveResult.matchedCount,
      modifiedCount: archiveResult.modifiedCount,
    },
    "Step 2: transactions archived.",
  );

  jobLogger.debug(
    { event: "step3_save_snapshot_begin", month, year },
    "Step 3: saving leaderboard snapshot.",
  );
  await ArchivedLeaderboardModel.findOneAndUpdate(
    { month, year },
    {
      month,
      year,
      topGivers,
      topReceivers,
    },
    { upsert: true },
  ).exec();

  jobLogger.info(
    {
      event: "step3_save_snapshot_done",
      month,
      year,
      topGiversCount: topGivers.length,
      topReceiversCount: topReceivers.length,
    },
    "Step 3: leaderboard snapshot saved.",
  );

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  jobLogger.info(
    { event: "step4_provision_begin", fromMonth: month, fromYear: year, nextMonth, nextYear },
    "Step 4: provisioning balances for next month.",
  );

  const users = await UserModel.find({}).populate("userCategoryId").lean().exec();
  jobLogger.debug(
    { event: "step4_users_loaded", count: users.length },
    "Step 4: users loaded for provisioning.",
  );

  if (users.length === 0) {
    jobLogger.warn(
      { event: "step4_no_users" },
      "Step 4: monthly balance provisioning skipped: no users found.",
    );
    return;
  }

  let provisionedCount = 0;
  let skippedCount = 0;
  for (const user of users) {
    const quota = effectiveQuotaForUser({
      userCategory: {
        monthlyGivingQuota: ((user.userCategoryId as unknown as { monthlyGivingQuota?: number | null })
          .monthlyGivingQuota ??
          null),
      },
    });
    const result = await UserGivingBalanceModel.findOneAndUpdate(
      { userId: user._id, month: nextMonth, year: nextYear },
      { $setOnInsert: { userId: user._id, month: nextMonth, year: nextYear, remainingPoints: quota } },
      { upsert: true, rawResult: true },
    ).exec() as unknown as { lastErrorObject?: { updatedExisting?: boolean } } | null;

    const wasInserted = !result?.lastErrorObject?.updatedExisting;
    if (wasInserted) {
      provisionedCount += 1;
    } else {
      skippedCount += 1;
    }
  }

  const durationMs = Date.now() - startedAt;
  jobLogger.info(
    {
      event: "monthly_reset_completed",
      usersTotal: users.length,
      provisionedCount,
      skippedCount,
      nextMonth,
      nextYear,
      durationMs,
    },
    "Monthly reset finished successfully.",
  );

  // After archiving the prior month, any stale current-month cache entries
  // (leaderboard + audit log) must be cleared so the now-empty surfaces
  // reflect reality on the next read.
  await invalidateAllKudosCaches("monthly_reset_archive");
};

export const runMonthlyBalanceProvisioning = async (): Promise<void> => {
  jobLogger.info({ event: "monthly_reset_invoked" }, "runMonthlyBalanceProvisioning invoked.");
  try {
    await archiveCurrentMonthAndProvisionNext();
  } catch (error) {
    jobLogger.error({ event: "monthly_reset_failed", err: error }, "Error during monthly balance provisioning.");
    throw error;
  }
};

export const scheduleMonthlyResetJob = (): void => {
  jobLogger.info(
    { event: "cron_register", cronExpression: config.CRON_MONTHLY_RESET },
    "Scheduling monthly reset cron job.",
  );
  cron.schedule(config.CRON_MONTHLY_RESET, async () => {
    jobLogger.info(
      { event: "cron_triggered", cronExpression: config.CRON_MONTHLY_RESET, firedAt: new Date().toISOString() },
      "Monthly reset cron tick fired.",
    );
    try {
      await runMonthlyBalanceProvisioning();
    } catch (error) {
      jobLogger.error({ event: "cron_run_failed", err: error }, "Monthly reset job failed.");
    }
  });
  jobLogger.info(
    { event: "cron_registered", cronExpression: config.CRON_MONTHLY_RESET },
    "Monthly reset cron job scheduled.",
  );
};
