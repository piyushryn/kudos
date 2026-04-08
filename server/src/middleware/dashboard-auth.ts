import type { NextFunction, Request, Response } from "express";

import { verifyUserSessionToken } from "../auth/session-token";
import { config } from "../config";

const DASHBOARD_SERVICE_TOKEN_HEADER = "x-dashboard-service-token";

const hasValidDashboardServiceToken = (req: Request): boolean =>
  req.header(DASHBOARD_SERVICE_TOKEN_HEADER) === config.DASHBOARD_SERVICE_TOKEN;

export const requireDashboardServiceToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!hasValidDashboardServiceToken(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

export const requireUserSessionAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!hasValidDashboardServiceToken(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing user session token" });
    return;
  }

  const claims = verifyUserSessionToken(
    authHeader.slice("Bearer ".length),
    config.USER_SESSION_SIGNING_SECRET,
  );
  if (!claims) {
    res.status(401).json({ error: "Invalid user session token" });
    return;
  }

  req.auth = {
    slackUserId: claims.slackUserId,
    displayName: claims.displayName,
  };
  next();
};
