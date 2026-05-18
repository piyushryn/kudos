import type { NextFunction, Request, Response } from "express";

import { verifyUserSessionToken } from "../auth/session-token";
import { config } from "../config";
import { getExistingUserWithRole } from "../services/rbac.service";

type Role = "user" | "admin" | "super_admin";
const SESSION_COOKIE_NAME = "kudos_user_session_v1";

const extractTokenFromCookieHeader = (cookieHeader: string | undefined): string | undefined => {
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName === SESSION_COOKIE_NAME) {
      return rawValue.join("=");
    }
  }
  return undefined;
};

export const requireRbacAuth =
  (allowedRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.header("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : undefined;
    const cookieToken = extractTokenFromCookieHeader(req.header("cookie"));
    const token = bearerToken ?? cookieToken;

    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const claims = verifyUserSessionToken(token, config.USER_SESSION_SIGNING_SECRET);
    if (!claims) {
      res.status(401).json({ error: "Invalid user session token" });
      return;
    }

    const user = await getExistingUserWithRole(claims.slackUserId);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    req.auth = {
      slackUserId: user.slackUserId,
      displayName: user.displayName,
      role: user.role,
    };
    next();
  };
