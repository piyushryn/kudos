import type { Request, Response } from "express";

import { getUserStatsBySlackId } from "../services/stats.service";

export const getMyStatsHandler = async (req: Request, res: Response): Promise<void> => {
  const slackUserId = req.auth?.slackUserId;
  const displayName = req.auth?.displayName;
  if (!slackUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const stats = await getUserStatsBySlackId(slackUserId, displayName);
  res.status(200).json(stats);
};
