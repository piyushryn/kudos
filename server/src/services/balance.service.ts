import { asObjectId } from "../db/mappers";
import { UserGivingBalanceModel, UserModel } from "../db/models";
import { getMonthYear } from "../utils/date";
import { effectiveQuotaForUser } from "../utils/balance-quota";

export const getOrCreateCurrentMonthBalance = async (userId: string) => {
  const { month, year } = getMonthYear();

  const existing = await UserGivingBalanceModel.findOne({
    userId: asObjectId(userId),
    month,
    year,
  })
    .lean()
    .exec();

  if (existing) {
    return {
      id: String(existing._id),
      userId: String(existing.userId),
      month: existing.month,
      year: existing.year,
      remainingPoints: existing.remainingPoints,
    };
  }

  const user = await UserModel.findById(asObjectId(userId)).populate("userCategoryId").lean().exec();
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }
  if (!user.userCategoryId || typeof user.userCategoryId !== "object") {
    throw new Error(`User category not found for user: ${userId}`);
  }

  const quota = effectiveQuotaForUser({
    userCategory: {
      monthlyGivingQuota: ((user.userCategoryId as unknown as { monthlyGivingQuota?: number | null })
        .monthlyGivingQuota ??
        null),
    },
  });

  const created = await UserGivingBalanceModel.create({
    userId: asObjectId(userId),
    month,
    year,
    remainingPoints: quota,
  });

  return {
    id: String(created._id),
    userId: String(created.userId),
    month: created.month,
    year: created.year,
    remainingPoints: created.remainingPoints,
  };
};

export const getCurrentMonthBalance = async (userId: string): Promise<number> => {
  const balance = await getOrCreateCurrentMonthBalance(userId);
  return balance.remainingPoints;
};
