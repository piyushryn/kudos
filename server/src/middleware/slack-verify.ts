import type { NextFunction, Request, Response } from "express";

import { logSlackSignatureRejected } from "../slack/command-logging";
import { verifySlackRequestSignature } from "../slack/signature";

export const verifySlackSignatureMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!verifySlackRequestSignature(req)) {
    logSlackSignatureRejected(req);
    res.status(401).json({
      response_type: "ephemeral",
      text: "⚠️ Invalid Slack signature.",
    });
    return;
  }

  next();
};
