import cron from "node-cron";

import { config } from "../config";
import { KudosEntryKind } from "../db/constants";
import { UserGivingBalanceModel, UserModel, KudosTransactionModel, ArchivedLeaderboardModel } from "../db/models";
import { logger } from "../logger";
import { getMonthYear } from "../utils/date";
import { effectiveQuotaForUser } from "../utils/balance-quota";

const archiveCurrentMonthAndProvisionNext = async (): Promise<void> => {
  const { month, year } = getMonthYear();

  // Step 1: Calculate final leaderboard before archiving
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

  // Get user details for leaderboard entries
  const userIds = [
    ...new Set([
      ...topGiversRaw.map((item) => item._id),
      ...topReceiversRaw.map((item) => item._id),
    ]),
  ];

  const usersMap = new Map();
  if (userIds.length > 0) {
    const users = await UserModel.find({ _id: { $in: userIds } }, { slackUserId: 1, displayName: 1 })
      .lean()
      .exec();
    users.forEach((user) => {
      usersMap.set(String(user._id), { slackUserId: user.slackUserId, displayName: user.displayName });
    });
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

  // Step 2: Archive all transactions for the current month
  await KudosTransactionModel.updateMany(
    { month, year, isArchived: false },
    { $set: { isArchived: true } },
  ).exec();

  // Step 3: Save leaderboard snapshot
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

  logger.info(
    {
      month,
      year,
      topGiversCount: topGivers.length,
      topReceiversCount: topReceivers.length,
    },
    "Monthly leaderboard archived.",
  );

  // Step 4: Provision balance for next month (original logic)
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const users = await UserModel.find({}).populate("userCategoryId").lean().exec();

  if (users.length === 0) {
    logger.info("Monthly balance provisioning skipped: no users found.");
    return;
  }

  for (const user of users) {
    const quota = effectiveQuotaForUser({
      userCategory: {
        monthlyGivingQuota: ((user.userCategoryId as unknown as { monthlyGivingQuota?: number | null })
          .monthlyGivingQuota ??
          null),
      },
    });
    await UserGivingBalanceModel.findOneAndUpdate(
      { userId: user._id, month: nextMonth, year: nextYear },
      { $setOnInsert: { userId: user._id, month: nextMonth, year: nextYear, remainingPoints: quota } },
      { upsert: true },
    ).exec();
  }

  logger.info(
    {
      usersUpdated: users.length,
      month: nextMonth,
      year: nextYear,
    },
    "Monthly balance provisioning finished.",
  );
};

export const runMonthlyBalanceProvisioning = async (): Promise<void> => {
  try {
    await archiveCurrentMonthAndProvisionNext();
  } catch (error) {
    logger.error({ err: error }, "Error during monthly balance provisioning.");
    throw error;
  }
};

export const scheduleMonthlyResetJob = (): void => {
  cron.schedule(config.CRON_MONTHLY_RESET, async () => {
    try {
      await runMonthlyBalanceProvisioning();
    } catch (error) {
      logger.error({ err: error }, "Monthly reset job failed.");
    }
  });
};
