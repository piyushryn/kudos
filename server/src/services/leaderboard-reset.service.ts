import { invalidateCurrentLeaderboard } from "../cache/invalidations";
import { KudosEntryKind } from "../db/constants";
import { asObjectId } from "../db/mappers";
import { KudosTransactionModel, UserModel } from "../db/models";
import { AppError } from "../utils/errors";
import { getMonthYear } from "../utils/date";
import { getSystemAuditUserId } from "./system-audit-user.service";

const leaderboardTotalsFilter = {
  kind: KudosEntryKind.KUDO,
  countsTowardTotals: true,
} as const;

/**
 * Stops all kudo rows from counting toward leaderboard / profile totals, and appends an audit log row.
 * No rows are deleted.
 */
export const performFullLeaderboardReset = async (): Promise<{ excludedFromTotals: number }> => {
  const { month, year } = getMonthYear();
  const systemUserId = await getSystemAuditUserId();
  const session = await KudosTransactionModel.startSession();
  let excludedFromTotals = 0;
  try {
    await session.withTransaction(async () => {
      const updated = await KudosTransactionModel.updateMany(
        leaderboardTotalsFilter,
        {
          $set: { countsTowardTotals: false },
        },
        { session },
      );
      excludedFromTotals = updated.modifiedCount;

      await KudosTransactionModel.create(
        [
          {
            kind: KudosEntryKind.ADMIN_RESET_ALL,
            countsTowardTotals: false,
            giverId: asObjectId(systemUserId),
            receiverId: asObjectId(systemUserId),
            points: 0,
            message:
              "[Admin] Full workspace leaderboard reset. All prior kudos remain in this log; they no longer count toward displayed totals.",
            month,
            year,
            channelId: null,
            channelName: null,
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  await invalidateCurrentLeaderboard("leaderboard_reset_all");

  return { excludedFromTotals };
};

/**
 * Excludes that user's kudo rows from totals and appends an audit log row. No rows are deleted.
 */
export const performUserLeaderboardResetByUserId = async (userId: string): Promise<{ excludedFromTotals: number }> => {
  const user = await UserModel.findById(asObjectId(userId), {
    _id: 1,
    displayName: 1,
    slackUserId: 1,
  })
    .lean()
    .exec();
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const { month, year } = getMonthYear();
  const systemUserId = await getSystemAuditUserId();
  const session = await KudosTransactionModel.startSession();
  let excludedFromTotals = 0;
  try {
    await session.withTransaction(async () => {
      const updated = await KudosTransactionModel.updateMany(
        {
          ...leaderboardTotalsFilter,
          $or: [{ giverId: asObjectId(userId) }, { receiverId: asObjectId(userId) }],
        },
        { $set: { countsTowardTotals: false } },
        { session },
      );
      excludedFromTotals = updated.modifiedCount;

      await KudosTransactionModel.create(
        [
          {
            kind: KudosEntryKind.ADMIN_RESET_USER,
            countsTowardTotals: false,
            giverId: asObjectId(systemUserId),
            receiverId: asObjectId(userId),
            points: 0,
            message: `[Admin] Leaderboard totals reset for ${user.displayName} (${user.slackUserId}). Prior kudos stay in this log; they no longer count toward displayed totals for this person.`,
            month,
            year,
            channelId: null,
            channelName: null,
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  await invalidateCurrentLeaderboard("leaderboard_reset_user");

  return { excludedFromTotals };
};

export const performUserLeaderboardResetBySlackId = async (
  slackUserId: string,
): Promise<{ excludedFromTotals: number }> => {
  const user = await UserModel.findOne({ slackUserId }, { _id: 1 }).lean().exec();
  if (!user) {
    throw new AppError("No user with that Slack ID.", 404);
  }
  return performUserLeaderboardResetByUserId(String(user._id));
};
