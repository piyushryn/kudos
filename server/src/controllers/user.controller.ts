import type { Request, Response } from "express";
import { z } from "zod";

import { getUserStatsBySlackId } from "../services/stats.service";
import { getOrCreateUserWithRole } from "../services/rbac.service";

const resolveSessionRoleBodySchema = z.object({
  slackUserId: z.string().min(1),
  displayName: z.string().min(1).optional(),
});

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

export const getMySessionHandler = async (req: Request, res: Response): Promise<void> => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.status(200).json({
    slackUserId: auth.slackUserId,
    displayName: auth.displayName,
    role: auth.role,
  });
};

export const postResolveSessionRoleHandler = async (req: Request, res: Response): Promise<void> => {
  const parsed = resolveSessionRoleBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body. Expected { slackUserId, displayName? }." });
    return;
  }

  const user = await getOrCreateUserWithRole(parsed.data.slackUserId, parsed.data.displayName);
  res.status(200).json(user);
};
