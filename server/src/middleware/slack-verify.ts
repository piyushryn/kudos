import type { NextFunction, Request, Response } from "express";

import { verifySlackRequestSignature } from "../slack/signature";

export const verifySlackSignatureMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!verifySlackRequestSignature(req)) {
    res.status(401).json({
      response_type: "ephemeral",
      text: "⚠️ Invalid Slack signature.",
    });
    return;
  }

  next();
};
