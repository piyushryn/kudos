import { Router } from "express";

import {
  getPublicLeaderboardHandler,
} from "../controllers/api.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireRbacAuth } from "../middleware/rbac-auth";

export const apiRouter = Router();

apiRouter.use(requireRbacAuth(["user", "admin", "super_admin"]));
apiRouter.get("/leaderboard", asyncHandler(getPublicLeaderboardHandler));
