import { KudosEntryKind } from "./constants";

import { KudosTransactionModel } from "./models";

export const kudosRepository = {
  async groupTopGivers(limit: number) {
    const rows = await KudosTransactionModel.aggregate<{
      _id: unknown;
      points: number;
    }>([
      { $match: { kind: KudosEntryKind.KUDO, countsTowardTotals: true } },
      { $group: { _id: "$giverId", points: { $sum: "$points" } } },
      { $sort: { points: -1 } },
      { $limit: limit },
    ]);
    return rows.map((row) => ({
      giverId: String(row._id),
      _sum: { points: row.points },
    }));
  },
  async groupTopReceivers(limit: number) {
    const rows = await KudosTransactionModel.aggregate<{
      _id: unknown;
      points: number;
    }>([
      { $match: { kind: KudosEntryKind.KUDO, countsTowardTotals: true } },
      { $group: { _id: "$receiverId", points: { $sum: "$points" } } },
      { $sort: { points: -1 } },
      { $limit: limit },
    ]);
    return rows.map((row) => ({
      receiverId: String(row._id),
      _sum: { points: row.points },
    }));
  },
};
