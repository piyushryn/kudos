import type { NextFunction, Request, Response } from "express";

import { logger } from "../logger";
import { AppError } from "../utils/errors";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
    });
    return;
  }

  logger.error({ err: error }, "Unhandled server error");
  res.status(500).json({
    error: "Internal server error",
  });
};
