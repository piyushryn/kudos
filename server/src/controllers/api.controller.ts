import type { Request, Response } from "express";

import { getLeaderboard, getUserStatsBySlackId, getAuditLog } from "../services/stats.service";

export const getLeaderboardHandler = async (_req: Request, res: Response): Promise<void> => {
  const leaderboard = await getLeaderboard(10);
  res.status(200).json(leaderboard);
};

export const getUserStatsHandler = async (req: Request, res: Response): Promise<void> => {
  const slackUserIdParam = req.params.slackUserId;
  const slackUserId = Array.isArray(slackUserIdParam) ? slackUserIdParam[0] : slackUserIdParam;
  if (!slackUserId) {
    res.status(400).json({ error: "slackUserId is required" });
    return;
  }
  const stats = await getUserStatsBySlackId(slackUserId);
  res.status(200).json(stats);
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
