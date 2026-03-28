import { Router } from "express";

import {
  getAuditLogHandler,
  getLeaderboardHandler,
  getUserStatsHandler,
} from "../controllers/api.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireInternalApiToken } from "../middleware/internal-auth";

export const apiRouter = Router();

apiRouter.use(requireInternalApiToken);
apiRouter.get("/leaderboard", asyncHandler(getLeaderboardHandler));
apiRouter.get("/users/:slackUserId/stats", asyncHandler(getUserStatsHandler));
apiRouter.get("/audit-log", asyncHandler(getAuditLogHandler));
