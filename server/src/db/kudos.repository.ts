import { KudosEntryKind } from "@prisma/client";

import { prisma } from "./prisma";

const totalsWhere = {
  kind: KudosEntryKind.KUDO,
  countsTowardTotals: true,
} as const;

export const kudosRepository = {
  groupTopGivers(limit: number) {
    return prisma.kudosTransaction.groupBy({
      by: ["giverId"],
      where: totalsWhere,
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: limit,
    });
  },
  groupTopReceivers(limit: number) {
    return prisma.kudosTransaction.groupBy({
      by: ["receiverId"],
      where: totalsWhere,
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: limit,
    });
  },
};
