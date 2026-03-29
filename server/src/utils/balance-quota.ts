import { config } from "../config";

/** Category-specific quota, or workspace default from env when unset / null. */
export const resolveEffectiveMonthlyQuota = (
  categoryMonthlyQuota: number | null | undefined,
): number => {
  if (
    categoryMonthlyQuota != null &&
    Number.isInteger(categoryMonthlyQuota) &&
    categoryMonthlyQuota > 0
  ) {
    return categoryMonthlyQuota;
  }
  return config.DEFAULT_MONTHLY_BALANCE;
};

export const effectiveQuotaForUser = (user: {
  userCategory: { monthlyGivingQuota: number | null } | null;
}): number => resolveEffectiveMonthlyQuota(user.userCategory?.monthlyGivingQuota);
