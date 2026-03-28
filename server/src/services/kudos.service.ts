import { config } from "../config";
import { prisma } from "../db/prisma";
import { getMonthYear, startOfUtcDay, endOfUtcDay } from "../utils/date";
import { AppError } from "../utils/errors";
import { getOrCreateUser } from "./user.service";

type GiveKudosParams = {
  giverSlackUserId: string;
  giverDisplayName: string;
  receiverSlackUserId: string;
  points: number;
  message: string;
};

type GiveKudosResult = {
  giverDisplayName: string;
  receiverDisplayName: string;
  points: number;
  message: string;
  remainingBalance: number;
};

const validateGiveKudos = (params: GiveKudosParams): void => {
  if (params.giverSlackUserId === params.receiverSlackUserId) {
    throw new AppError("You cannot give kudos to yourself.", 400);
  }

  if (!Number.isInteger(params.points) || params.points <= 0) {
    throw new AppError("Points must be a positive whole number.", 400);
  }

  if (params.points > config.MAX_KUDOS_PER_TRANSACTION) {
    throw new AppError(
      `You can give at most ${config.MAX_KUDOS_PER_TRANSACTION} points per transaction.`,
      400,
    );
  }
};

const validateDailyReceiverCap = async (receiverId: string, points: number): Promise<void> => {
  if (!config.ENABLE_DAILY_RECEIVER_CAP || !config.DAILY_RECEIVER_CAP) {
    return;
  }

  const totalToday = await prisma.kudosTransaction.aggregate({
    _sum: { points: true },
    where: {
      receiverId,
      createdAt: {
        gte: startOfUtcDay(),
        lte: endOfUtcDay(),
      },
    },
  });

  const receivedToday = totalToday._sum.points ?? 0;
  if (receivedToday + points > config.DAILY_RECEIVER_CAP) {
    throw new AppError(
      `Receiver has reached the daily cap of ${config.DAILY_RECEIVER_CAP} points.`,
      400,
    );
  }
};

export const giveKudos = async (params: GiveKudosParams): Promise<GiveKudosResult> => {
  validateGiveKudos(params);

  const giver = await getOrCreateUser(params.giverSlackUserId, params.giverDisplayName);
  const receiver = await getOrCreateUser(params.receiverSlackUserId);

  await validateDailyReceiverCap(receiver.id, params.points);

  const { month, year } = getMonthYear();

  return prisma.$transaction(async (tx) => {
    const balance = await tx.userGivingBalance.upsert({
      where: {
        userId_month_year: {
          userId: giver.id,
          month,
          year,
        },
      },
      create: {
        userId: giver.id,
        month,
        year,
        remainingPoints: config.DEFAULT_MONTHLY_BALANCE,
      },
      update: {},
    });

    if (balance.remainingPoints < params.points) {
      throw new AppError(
        `Insufficient balance. Remaining points: ${balance.remainingPoints}.`,
        400,
      );
    }

    const updatedBalance = await tx.userGivingBalance.update({
      where: { id: balance.id },
      data: {
        remainingPoints: { decrement: params.points },
      },
    });

    await tx.kudosTransaction.create({
      data: {
        giverId: giver.id,
        receiverId: receiver.id,
        points: params.points,
        message: params.message,
        month,
        year,
      },
    });

    return {
      giverDisplayName: giver.displayName,
      receiverDisplayName: receiver.displayName,
      points: params.points,
      message: params.message,
      remainingBalance: updatedBalance.remainingPoints,
    };
  });
};
