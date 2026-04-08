import type { Request, Response } from "express";

import { getAuditLog, getLeaderboard } from "../services/stats.service";

export const getPublicLeaderboardHandler = async (_req: Request, res: Response): Promise<void> => {
  const leaderboard = await getLeaderboard(10);
  res.status(200).json({
    topGivers: leaderboard.topGivers.map(({ displayName, points }) => ({ displayName, points })),
    topReceivers: leaderboard.topReceivers.map(({ displayName, points }) => ({ displayName, points })),
  });
};

export const getAdminLeaderboardHandler = async (_req: Request, res: Response): Promise<void> => {
  const leaderboard = await getLeaderboard(10);
  res.status(200).json(leaderboard);
};

export const getAuditLogHandler = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 25);
  const result = await getAuditLog(
    Number.isInteger(page) && page > 0 ? page : 1,
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100 ? pageSize : 25,
  );
  res.status(200).json(result);
};
