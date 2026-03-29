import type { Request, Response } from "express";
import { z } from "zod";

import {
  bulkSetUserCategoryBySlackIds,
  getWorkspaceQuotaDefaults,
  listUsersForAdmin,
  resetAllUsersCurrentMonthBalances,
  resetCurrentMonthBalanceBySlackId,
  setUserCategoryBySlackId,
} from "../services/admin-balance.service";
import { AppError } from "../utils/errors";

const assignCategoryBodySchema = z.object({
  userCategoryId: z.string().min(1),
});

const bulkCategoryBodySchema = z.object({
  slackUserIds: z.array(z.string().min(1)).min(1).max(500),
  userCategoryId: z.string().min(1),
});

const slackUserIdFromParams = (req: Request): string => {
  const raw = req.params.slackUserId;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) {
    throw new AppError("slackUserId is required", 400);
  }
  return decodeURIComponent(v);
};

export const listAdminUsersHandler = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 50);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const result = await listUsersForAdmin(
    Number.isInteger(page) && page > 0 ? page : 1,
    Number.isInteger(limit) && limit > 0 ? limit : 50,
    search,
  );
  res.status(200).json({
    ...result,
    ...getWorkspaceQuotaDefaults(),
  });
};

export const assignSlackUserCategoryHandler = async (req: Request, res: Response): Promise<void> => {
  const slackUserId = slackUserIdFromParams(req);
  const parsed = assignCategoryBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body. Expected { userCategoryId: string }." });
    return;
  }
  await setUserCategoryBySlackId(slackUserId, parsed.data.userCategoryId);
  res.status(200).json({ ok: true });
};

export const postResetUserBalanceHandler = async (req: Request, res: Response): Promise<void> => {
  const slackUserId = slackUserIdFromParams(req);
  await resetCurrentMonthBalanceBySlackId(slackUserId);
  res.status(200).json({ ok: true });
};

export const postBulkCategoryHandler = async (req: Request, res: Response): Promise<void> => {
  const parsed = bulkCategoryBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid body. Expected { slackUserIds: string[], userCategoryId: string }.",
    });
    return;
  }
  const result = await bulkSetUserCategoryBySlackIds(
    parsed.data.slackUserIds,
    parsed.data.userCategoryId,
  );
  res.status(200).json({ ok: true, ...result });
};

export const postResetAllBalancesHandler = async (_req: Request, res: Response): Promise<void> => {
  const result = await resetAllUsersCurrentMonthBalances();
  res.status(200).json({ ok: true, ...result });
};
