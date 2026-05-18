import cron from "node-cron";

import { config } from "../config";
import { UserGivingBalanceModel, UserModel } from "../db/models";
import { logger } from "../logger";
import { getMonthYear } from "../utils/date";
import { effectiveQuotaForUser } from "../utils/balance-quota";

export const runMonthlyBalanceProvisioning = async (): Promise<void> => {
  const { month, year } = getMonthYear();
  const users = await UserModel.find({}).populate("userCategoryId").lean().exec();

  if (users.length === 0) {
    logger.info("Monthly reset skipped: no users found.");
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
      { userId: user._id, month, year },
      { $setOnInsert: { userId: user._id, month, year, remainingPoints: quota } },
      { upsert: true },
    ).exec();
  }

  logger.info(
    {
      usersUpdated: users.length,
      month,
      year,
    },
    "Monthly balance provisioning finished.",
  );
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
