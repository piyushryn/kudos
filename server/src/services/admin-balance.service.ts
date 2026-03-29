import { config } from "../config";
import { prisma } from "../db/prisma";
import { getMonthYear } from "../utils/date";
import { effectiveQuotaForUser } from "../utils/balance-quota";
import { AppError } from "../utils/errors";

export const upsertCurrentMonthBalanceToQuota = async (userId: string): Promise<void> => {
  const { month, year } = getMonthYear();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userCategory: true },
  });
  if (!user) {
    throw new AppError("User not found.", 404);
  }
  const quota = effectiveQuotaForUser(user);

  await prisma.userGivingBalance.upsert({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
    create: {
      userId,
      month,
      year,
      remainingPoints: quota,
    },
    update: {
      remainingPoints: quota,
    },
  });
};

export const setUserCategoryBySlackId = async (
  slackUserId: string,
  userCategoryId: string,
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { slackUserId } });
  if (!user) {
    throw new AppError(
      `No user with Slack ID ${slackUserId}. They must interact with the app first, or check the ID.`,
      404,
    );
  }
  const category = await prisma.userCategory.findUnique({ where: { id: userCategoryId } });
  if (!category) {
    throw new AppError("Unknown user category.", 404);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { userCategoryId },
  });
};

export const bulkSetUserCategoryBySlackIds = async (
  slackUserIds: string[],
  userCategoryId: string,
): Promise<{ updated: number }> => {
  const category = await prisma.userCategory.findUnique({ where: { id: userCategoryId } });
  if (!category) {
    throw new AppError("Unknown user category.", 404);
  }
  const normalized = [...new Set(slackUserIds.map((id) => id.trim()).filter(Boolean))];
  if (normalized.length === 0) {
    throw new AppError("Provide at least one Slack user ID.", 400);
  }
  if (normalized.length > 500) {
    throw new AppError("At most 500 Slack user IDs per request.", 400);
  }

  const result = await prisma.user.updateMany({
    where: { slackUserId: { in: normalized } },
    data: { userCategoryId },
  });

  return { updated: result.count };
};

export const resetCurrentMonthBalanceBySlackId = async (slackUserId: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { slackUserId } });
  if (!user) {
    throw new AppError(`No user with Slack ID ${slackUserId}. They may not have used the app yet.`, 404);
  }
  await upsertCurrentMonthBalanceToQuota(user.id);
};

export const resetAllUsersCurrentMonthBalances = async (): Promise<{ usersReset: number }> => {
  const { month, year } = getMonthYear();
  const allUsers = await prisma.user.findMany({ include: { userCategory: true } });

  await prisma.$transaction(async (tx) => {
    for (const user of allUsers) {
      const quota = effectiveQuotaForUser(user);
      await tx.userGivingBalance.upsert({
        where: {
          userId_month_year: {
            userId: user.id,
            month,
            year,
          },
        },
        create: {
          userId: user.id,
          month,
          year,
          remainingPoints: quota,
        },
        update: {
          remainingPoints: quota,
        },
      });
    }
  });

  return { usersReset: allUsers.length };
};

export type AdminUserCategorySummary = {
  id: string;
  key: string;
  name: string;
  monthlyGivingQuota: number | null;
};

export type AdminUserRow = {
  id: string;
  slackUserId: string;
  displayName: string;
  userCategory: AdminUserCategorySummary;
  effectiveMonthlyQuota: number;
  remainingBalanceThisMonth: number;
};

export const listUsersForAdmin = async (
  page = 1,
  limit = 50,
  search?: string,
): Promise<{ users: AdminUserRow[]; total: number; page: number; pageSize: number }> => {
  const pageSize = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * pageSize;
  const { month, year } = getMonthYear();

  const where =
    search && search.trim().length > 0
      ? {
          OR: [
            { displayName: { contains: search.trim(), mode: "insensitive" as const } },
            { slackUserId: { contains: search.trim() } },
          ],
        }
      : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { displayName: "asc" },
      skip,
      take: pageSize,
      include: { userCategory: true },
    }),
    prisma.user.count({ where }),
  ]);

  const ids = users.map((u) => u.id);
  const balances =
    ids.length === 0
      ? []
      : await prisma.userGivingBalance.findMany({
          where: {
            userId: { in: ids },
            month,
            year,
          },
        });
  const balByUser = new Map(balances.map((b) => [b.userId, b.remainingPoints]));

  const rows: AdminUserRow[] = users.map((u) => {
    const effective = effectiveQuotaForUser(u);
    const remaining = balByUser.get(u.id);
    return {
      id: u.id,
      slackUserId: u.slackUserId,
      displayName: u.displayName,
      userCategory: {
        id: u.userCategory.id,
        key: u.userCategory.key,
        name: u.userCategory.name,
        monthlyGivingQuota: u.userCategory.monthlyGivingQuota,
      },
      effectiveMonthlyQuota: effective,
      remainingBalanceThisMonth: remaining ?? effective,
    };
  });

  return { users: rows, total, page: Math.max(page, 1), pageSize };
};

export const getWorkspaceQuotaDefaults = (): { defaultMonthlyBalance: number } => ({
  defaultMonthlyBalance: config.DEFAULT_MONTHLY_BALANCE,
});
