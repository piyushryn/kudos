import cron from "node-cron";

import { config } from "../config";
import { prisma } from "../db/prisma";
import { userRepository } from "../db/user.repository";
import { logger } from "../logger";
import { getMonthYear } from "../utils/date";

export const runMonthlyBalanceProvisioning = async (): Promise<void> => {
  const { month, year } = getMonthYear();
  const users = await userRepository.findAllIds();

  if (users.length === 0) {
    logger.info("Monthly reset skipped: no users found.");
    return;
  }

  await prisma.$transaction(
    users.map((user) =>
      prisma.userGivingBalance.upsert({
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
          remainingPoints: config.DEFAULT_MONTHLY_BALANCE,
        },
        update: {},
      }),
    ),
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
