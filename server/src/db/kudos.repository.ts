import { prisma } from "./prisma";

export const kudosRepository = {
  groupTopGivers(limit: number) {
    return prisma.kudosTransaction.groupBy({
      by: ["giverId"],
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: limit,
    });
  },
  groupTopReceivers(limit: number) {
    return prisma.kudosTransaction.groupBy({
      by: ["receiverId"],
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: limit,
    });
  },
};
