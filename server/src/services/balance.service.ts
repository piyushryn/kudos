import { prisma } from "../db/prisma";
import { getMonthYear } from "../utils/date";
import { effectiveQuotaForUser } from "../utils/balance-quota";

export const getOrCreateCurrentMonthBalance = async (userId: string) => {
  const { month, year } = getMonthYear();

  const existing = await prisma.userGivingBalance.findUnique({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
  });

  if (existing) {
    return existing;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userCategory: true },
  });
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const quota = effectiveQuotaForUser(user);

  return prisma.userGivingBalance.create({
    data: {
      userId,
      month,
      year,
      remainingPoints: quota,
    },
  });
};

export const getCurrentMonthBalance = async (userId: string): Promise<number> => {
  const balance = await getOrCreateCurrentMonthBalance(userId);
  return balance.remainingPoints;
};
