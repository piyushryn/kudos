import type { Request, Response } from "express";

import { getUserStatsForSlackId } from "../services/stats.service";

export const getMyStatsHandler = async (req: Request, res: Response): Promise<void> => {
  const slackUserId = req.auth?.slackUserId;
  if (!slackUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const stats = await getUserStatsForSlackId(slackUserId);
  res.status(200).json(stats);
};
