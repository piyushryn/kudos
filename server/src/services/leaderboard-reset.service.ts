import { KudosEntryKind } from "@prisma/client";

import { prisma } from "../db/prisma";
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

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.kudosTransaction.updateMany({
      where: leaderboardTotalsFilter,
      data: { countsTowardTotals: false },
    });

    await tx.kudosTransaction.create({
      data: {
        kind: KudosEntryKind.ADMIN_RESET_ALL,
        countsTowardTotals: false,
        giverId: systemUserId,
        receiverId: systemUserId,
        points: 0,
        message:
          "[Admin] Full workspace leaderboard reset. All prior kudos remain in this log; they no longer count toward displayed totals.",
        month,
        year,
        channelId: null,
        channelName: null,
      },
    });

    return updated.count;
  });

  return { excludedFromTotals: result };
};

/**
 * Excludes that user's kudo rows from totals and appends an audit log row. No rows are deleted.
 */
export const performUserLeaderboardResetByUserId = async (userId: string): Promise<{ excludedFromTotals: number }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, displayName: true, slackUserId: true },
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const { month, year } = getMonthYear();
  const systemUserId = await getSystemAuditUserId();

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.kudosTransaction.updateMany({
      where: {
        ...leaderboardTotalsFilter,
        OR: [{ giverId: userId }, { receiverId: userId }],
      },
      data: { countsTowardTotals: false },
    });

    await tx.kudosTransaction.create({
      data: {
        kind: KudosEntryKind.ADMIN_RESET_USER,
        countsTowardTotals: false,
        giverId: systemUserId,
        receiverId: user.id,
        points: 0,
        message: `[Admin] Leaderboard totals reset for ${user.displayName} (${user.slackUserId}). Prior kudos stay in this log; they no longer count toward displayed totals for this person.`,
        month,
        year,
        channelId: null,
        channelName: null,
      },
    });

    return updated.count;
  });

  return { excludedFromTotals: result };
};

export const performUserLeaderboardResetBySlackId = async (
  slackUserId: string,
): Promise<{ excludedFromTotals: number }> => {
  const user = await prisma.user.findUnique({
    where: { slackUserId },
    select: { id: true },
  });
  if (!user) {
    throw new AppError("No user with that Slack ID.", 404);
  }
  return performUserLeaderboardResetByUserId(user.id);
};
