import type { Request, Response } from "express";
import { z } from "zod";

import { getAuditLog, getLeaderboard } from "../services/stats.service";
import { getArchivedLeaderboard, listArchivedLeaderboards } from "../services/leaderboard-archive.service";
import { AppError } from "../utils/errors";

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

const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  showArchived: z.enum(["true", "false"]).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).optional(),
});

export const getAuditLogHandler = async (req: Request, res: Response): Promise<void> => {
  const parsed = auditLogQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters." });
    return;
  }

  const { page = 1, pageSize = 25, showArchived, month, year } = parsed.data;
  const isArchived = showArchived === "true";

  if (isArchived && (month === undefined || year === undefined)) {
    res.status(400).json({ error: "month and year are required when showArchived=true." });
    return;
  }

  const filters: { isArchived: boolean; month?: number; year?: number } = { isArchived };
  if (isArchived && month !== undefined && year !== undefined) {
    filters.month = month;
    filters.year = year;
  }

  const result = await getAuditLog(page, pageSize, filters);
  res.status(200).json(result);
};

const archivedLeaderboardQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000),
});

export const getArchivedLeaderboardHandler = async (req: Request, res: Response): Promise<void> => {
  const parsed = archivedLeaderboardQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid month or year parameter." });
    return;
  }

  const leaderboard = await getArchivedLeaderboard(parsed.data.month, parsed.data.year);
  if (!leaderboard) {
    res.status(404).json({ error: "Archived leaderboard not found for this month." });
    return;
  }

  res.status(200).json({
    month: leaderboard.month,
    year: leaderboard.year,
    archivedAt: leaderboard.archivedAt,
    topGivers: leaderboard.topGivers.map(({ displayName, points }) => ({ displayName, points })),
    topReceivers: leaderboard.topReceivers.map(({ displayName, points }) => ({ displayName, points })),
  });
};

export const listArchivedLeaderboardsHandler = async (_req: Request, res: Response): Promise<void> => {
  const archives = await listArchivedLeaderboards();
  res.status(200).json({
    archives: archives.map((a) => ({
      month: a.month,
      year: a.year,
      archivedAt: a.archivedAt,
    })),
  });
};
