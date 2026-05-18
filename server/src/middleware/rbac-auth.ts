import type { NextFunction, Request, Response } from "express";

import { verifyUserSessionToken } from "../auth/session-token";
import { config } from "../config";
import { getExistingUserWithRole } from "../services/rbac.service";

type Role = "user" | "admin" | "super_admin";

export const requireRbacAuth =
  (allowedRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.header("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
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
