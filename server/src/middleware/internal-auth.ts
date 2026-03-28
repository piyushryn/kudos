import type { NextFunction, Request, Response } from "express";

import { config } from "../config";

export const requireInternalApiToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!config.INTERNAL_API_TOKEN) {
    next();
    return;
  }

  const authHeader = req.header("authorization");
  if (authHeader === `Bearer ${config.INTERNAL_API_TOKEN}`) {
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized" });
};
