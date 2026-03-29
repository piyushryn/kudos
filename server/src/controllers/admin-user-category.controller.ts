import type { Request, Response } from "express";
import { z } from "zod";

import {
  createUserCategory,
  deleteUserCategory,
  listUserCategories,
  updateUserCategory,
} from "../services/admin-user-category.service";
import { AppError } from "../utils/errors";

const createBodySchema = z.object({
  key: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  monthlyQuota: z.union([z.number().int().positive().max(1_000_000), z.null()]).optional(),
});

const patchBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  monthlyQuota: z.union([z.number().int().positive().max(1_000_000), z.null()]).optional(),
});

const categoryIdFromParams = (req: Request): string => {
  const raw = req.params.id;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) {
    throw new AppError("Category id is required", 400);
  }
  return decodeURIComponent(v);
};

export const listUserCategoriesHandler = async (_req: Request, res: Response): Promise<void> => {
  const categories = await listUserCategories();
  res.status(200).json({ categories });
};

export const postUserCategoryHandler = async (req: Request, res: Response): Promise<void> => {
  const parsed = createBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid body. Expected { key, name, monthlyQuota: number | null }.",
    });
    return;
  }
  const category = await createUserCategory({
    ...parsed.data,
    monthlyQuota: parsed.data.monthlyQuota ?? null,
  });
  res.status(201).json(category);
};

export const patchUserCategoryHandler = async (req: Request, res: Response): Promise<void> => {
  const id = categoryIdFromParams(req);
  const parsed = patchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid body. Expected optional { name, monthlyQuota: number | null }.",
    });
    return;
  }
  const patch: { name?: string; monthlyQuota?: number | null } = {};
  if (parsed.data.name !== undefined) {
    patch.name = parsed.data.name;
  }
  if (parsed.data.monthlyQuota !== undefined) {
    patch.monthlyQuota = parsed.data.monthlyQuota;
  }
  const category = await updateUserCategory(id, patch);
  res.status(200).json(category);
};

export const deleteUserCategoryHandler = async (req: Request, res: Response): Promise<void> => {
  const id = categoryIdFromParams(req);
  await deleteUserCategory(id);
  res.status(200).json({ ok: true });
};
