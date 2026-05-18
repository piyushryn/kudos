import { config } from "../config";
import { KudosEntryKind } from "../db/constants";
import { asObjectId } from "../db/mappers";
import { KudosTransactionModel, UserGivingBalanceModel } from "../db/models";
import { getMonthYear, startOfUtcDay, endOfUtcDay } from "../utils/date";
import { effectiveQuotaForUser } from "../utils/balance-quota";
import { AppError } from "../utils/errors";
import { getOrCreateUser } from "./user.service";

type GiveKudosParams = {
  giverSlackUserId: string;
  giverDisplayName: string;
  receiverSlackUserId: string;
  points: number;
  message: string;
  slackChannelId: string;
  slackChannelName: string;
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

  const [totalToday] = await KudosTransactionModel.aggregate<{ points: number }>([
    {
      $match: {
        receiverId: asObjectId(receiverId),
        kind: KudosEntryKind.KUDO,
        countsTowardTotals: true,
        createdAt: {
          $gte: startOfUtcDay(),
          $lte: endOfUtcDay(),
        },
      },
    },
    { $group: { _id: null, points: { $sum: "$points" } } },
  ]);

  const receivedToday = totalToday?.points ?? 0;
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
  const giverQuota = effectiveQuotaForUser(giver);

  const userObjectId = asObjectId(giver.id);
  const balance = await UserGivingBalanceModel.findOneAndUpdate(
    { userId: userObjectId, month, year },
    { $setOnInsert: { userId: userObjectId, month, year, remainingPoints: giverQuota } },
    { upsert: true, new: true },
  ).lean();
  if (!balance) {
    throw new Error("Unable to upsert giver balance.");
  }

  if (balance.remainingPoints < params.points) {
    throw new AppError(
      `Insufficient balance. Remaining points: ${balance.remainingPoints}.`,
      400,
    );
  }

  const updatedBalance = await UserGivingBalanceModel.findOneAndUpdate(
    { _id: balance._id, remainingPoints: { $gte: params.points } },
    { $inc: { remainingPoints: -params.points } },
    { new: true },
  )
    .lean()
    .exec();
  if (!updatedBalance) {
    throw new AppError("Insufficient balance.", 400);
  }

  await KudosTransactionModel.create({
    kind: KudosEntryKind.KUDO,
    countsTowardTotals: true,
    giverId: asObjectId(giver.id),
    receiverId: asObjectId(receiver.id),
    points: params.points,
    message: params.message,
    month,
    year,
    channelId: params.slackChannelId,
    channelName: params.slackChannelName,
  });

  return {
    giverDisplayName: giver.displayName,
    receiverDisplayName: receiver.displayName,
    points: params.points,
    message: params.message,
    remainingBalance: updatedBalance.remainingPoints,
  };
};
