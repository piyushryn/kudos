import { config } from "../config";
import { KudosEntryKind } from "../db/constants";
import { kudosRepository } from "../db/kudos.repository";
import { asObjectId } from "../db/mappers";
import { KudosTransactionModel, UserModel } from "../db/models";
import { userRepository } from "../db/user.repository";
import { getMonthYear } from "../utils/date";
import { AppError } from "../utils/errors";
import { effectiveQuotaForUser } from "../utils/balance-quota";
import { getOrCreateCurrentMonthBalance } from "./balance.service";
import { getOrCreateUser } from "./user.service";

type LeaderboardEntry = {
  userId: string;
  displayName: string;
  points: number;
};

export const getLeaderboard = async (limit = 10) => {
  const [topGiversRaw, topReceiversRaw] = await Promise.all([
    kudosRepository.groupTopGivers(limit),
    kudosRepository.groupTopReceivers(limit),
  ]);

  const userIds = [
    ...new Set([
      ...topGiversRaw.map((item) => item.giverId),
      ...topReceiversRaw.map((item) => item.receiverId),
    ]),
  ];

  const users = userIds.length
    ? await UserModel.find(
        { _id: { $in: userIds.map((id) => asObjectId(id)) } },
        { displayName: 1 },
      )
        .lean()
        .exec()
    : [];
  const userMap = new Map(users.map((u) => [String(u._id), u.displayName]));

  const topGivers: LeaderboardEntry[] = topGiversRaw.map((item) => ({
    userId: item.giverId,
    displayName: userMap.get(item.giverId) ?? item.giverId,
    points: item._sum.points ?? 0,
  }));

  const topReceivers: LeaderboardEntry[] = topReceiversRaw.map((item) => ({
    userId: item.receiverId,
    displayName: userMap.get(item.receiverId) ?? item.receiverId,
    points: item._sum.points ?? 0,
  }));

  return { topGivers, topReceivers };
};

const kudoTotalsWhere = {
  kind: KudosEntryKind.KUDO,
  countsTowardTotals: true,
} as const;

export const getUserStatsBySlackId = async (slackUserId: string) => {
  const user = await getOrCreateUser(slackUserId);
  return buildUserStatsResponse(user);
};

export const getUserStatsForSlackId = async (slackUserId: string) => {
  const user = await userRepository.findBySlackUserId(slackUserId);
  if (!user) {
    throw new AppError("User not found. Use a Slack command first to initialize your profile.", 404);
  }
  return buildUserStatsResponse(user);
};

const buildUserStatsResponse = async (user: Awaited<ReturnType<typeof getOrCreateUser>>) => {
  const [given, received, balance] = await Promise.all([
    KudosTransactionModel.aggregate<{ points: number }>([
      { $match: { giverId: asObjectId(user.id), ...kudoTotalsWhere } },
      { $group: { _id: null, points: { $sum: "$points" } } },
    ]),
    KudosTransactionModel.aggregate<{ points: number }>([
      { $match: { receiverId: asObjectId(user.id), ...kudoTotalsWhere } },
      { $group: { _id: null, points: { $sum: "$points" } } },
    ]),
    getOrCreateCurrentMonthBalance(user.id),
  ]);

  return {
    slackUserId: user.slackUserId,
    displayName: user.displayName,
    totalGiven: given[0]?.points ?? 0,
    totalReceived: received[0]?.points ?? 0,
    remainingBalance: balance.remainingPoints,
    userCategory: {
      id: user.userCategory.id,
      key: user.userCategory.key,
      name: user.userCategory.name,
      monthlyGivingQuota: user.userCategory.monthlyGivingQuota,
    },
    effectiveMonthlyQuota: effectiveQuotaForUser(user),
    workspaceDefaultMonthlyBalance: config.DEFAULT_MONTHLY_BALANCE,
  };
};

export const getCurrentMonthStats = async () => {
  const { month, year } = getMonthYear();
  const [topGiversRaw, topReceiversRaw] = await Promise.all([
    KudosTransactionModel.aggregate<{ _id: unknown; points: number }>([
      { $match: { month, year, ...kudoTotalsWhere } },
      { $group: { _id: "$giverId", points: { $sum: "$points" } } },
      { $sort: { points: -1 } },
      { $limit: 10 },
    ]),
    KudosTransactionModel.aggregate<{ _id: unknown; points: number }>([
      { $match: { month, year, ...kudoTotalsWhere } },
      { $group: { _id: "$receiverId", points: { $sum: "$points" } } },
      { $sort: { points: -1 } },
      { $limit: 10 },
    ]),
  ]);
  return {
    topGiversRaw: topGiversRaw.map((row) => ({ giverId: String(row._id), _sum: { points: row.points } })),
    topReceiversRaw: topReceiversRaw.map((row) => ({
      receiverId: String(row._id),
      _sum: { points: row.points },
    })),
  };
};

export const getAuditLog = async (page = 1, pageSize = 25) => {
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    KudosTransactionModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("giverId", "slackUserId displayName")
      .populate("receiverId", "slackUserId displayName")
      .lean()
      .exec(),
    KudosTransactionModel.countDocuments({}),
  ]);

  return {
    page,
    pageSize,
    total,
    items: items.map((item) => ({
      id: String(item._id),
      kind: item.kind,
      createdAt: item.createdAt,
      points: item.points,
      message: item.message,
      channelId: item.channelId,
      channelName: item.channelName,
      giver: {
        slackUserId: (item.giverId as unknown as { slackUserId: string }).slackUserId,
        displayName: (item.giverId as unknown as { displayName: string }).displayName,
      },
      receiver: {
        slackUserId: (item.receiverId as unknown as { slackUserId: string }).slackUserId,
        displayName: (item.receiverId as unknown as { displayName: string }).displayName,
      },
    })),
  };
};
