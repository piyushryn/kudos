import { KudosEntryKind } from "@prisma/client";

import { config } from "../config";
import { kudosRepository } from "../db/kudos.repository";
import { prisma } from "../db/prisma";
import { getMonthYear } from "../utils/date";
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

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.displayName]));

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

  const [given, received, balance] = await Promise.all([
    prisma.kudosTransaction.aggregate({
      _sum: { points: true },
      where: { giverId: user.id, ...kudoTotalsWhere },
    }),
    prisma.kudosTransaction.aggregate({
      _sum: { points: true },
      where: { receiverId: user.id, ...kudoTotalsWhere },
    }),
    getOrCreateCurrentMonthBalance(user.id),
  ]);

  return {
    slackUserId: user.slackUserId,
    displayName: user.displayName,
    totalGiven: given._sum.points ?? 0,
    totalReceived: received._sum.points ?? 0,
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
    prisma.kudosTransaction.groupBy({
      by: ["giverId"],
      _sum: { points: true },
      where: { month, year, ...kudoTotalsWhere },
      orderBy: { _sum: { points: "desc" } },
      take: 10,
    }),
    prisma.kudosTransaction.groupBy({
      by: ["receiverId"],
      _sum: { points: true },
      where: { month, year, ...kudoTotalsWhere },
      orderBy: { _sum: { points: "desc" } },
      take: 10,
    }),
  ]);
  return { topGiversRaw, topReceiversRaw };
};

export const getAuditLog = async (page = 1, pageSize = 25) => {
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.kudosTransaction.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        giver: { select: { slackUserId: true, displayName: true } },
        receiver: { select: { slackUserId: true, displayName: true } },
      },
    }),
    prisma.kudosTransaction.count(),
  ]);

  return {
    page,
    pageSize,
    total,
    items: items.map((item) => ({
      id: item.id,
      kind: item.kind,
      createdAt: item.createdAt,
      points: item.points,
      message: item.message,
      channelId: item.channelId,
      channelName: item.channelName,
      giver: item.giver,
      receiver: item.receiver,
    })),
  };
};
