import type { Request, Response } from "express";
import { z } from "zod";

import {
  deleteAllKudosTransactions,
  deleteKudosTransactionsForSlackUserId,
  deleteKudosTransactionsForUserId,
} from "../services/leaderboard-reset.service";

const resetUserBodySchema = z.union([
  z.object({ userId: z.string().min(1) }),
  z.object({ slackUserId: z.string().min(1) }),
]);

export const postResetLeaderboardAllHandler = async (_req: Request, res: Response): Promise<void> => {
  const result = await deleteAllKudosTransactions();
  res.status(200).json({ ok: true, ...result });
};

export const postResetLeaderboardUserHandler = async (req: Request, res: Response): Promise<void> => {
  const parsed = resetUserBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid body. Expected { userId: string } or { slackUserId: string }.",
    });
    return;
  }
  const result =
    "userId" in parsed.data
      ? await deleteKudosTransactionsForUserId(parsed.data.userId)
      : await deleteKudosTransactionsForSlackUserId(parsed.data.slackUserId);
  res.status(200).json({ ok: true, ...result });
};
