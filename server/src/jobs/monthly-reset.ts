import cron from "node-cron";

import { config } from "../config";
import { prisma } from "../db/prisma";
import { logger } from "../logger";
import { getMonthYear } from "../utils/date";
import { effectiveQuotaForUser } from "../utils/balance-quota";

export const runMonthlyBalanceProvisioning = async (): Promise<void> => {
  const { month, year } = getMonthYear();
  const users = await prisma.user.findMany({
    include: { userCategory: true },
  });

  if (users.length === 0) {
    logger.info("Monthly reset skipped: no users found.");
    return;
  }

  await prisma.$transaction(
    users.map((user) => {
      const quota = effectiveQuotaForUser(user);
      return prisma.userGivingBalance.upsert({
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
        update: {},
      });
    }),
  );

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
