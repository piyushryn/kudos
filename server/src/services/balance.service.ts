import { config } from "../config";
import { prisma } from "../db/prisma";
import { getMonthYear } from "../utils/date";

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

  return prisma.userGivingBalance.create({
    data: {
      userId,
      month,
      year,
      remainingPoints: config.DEFAULT_MONTHLY_BALANCE,
    },
  });
};

export const getCurrentMonthBalance = async (userId: string): Promise<number> => {
  const balance = await getOrCreateCurrentMonthBalance(userId);
  return balance.remainingPoints;
};
