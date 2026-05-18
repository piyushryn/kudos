import { Router } from "express";

import { getPublicLeaderboardHandler } from "../controllers/api.controller";
import { postResolveSessionRoleHandler } from "../controllers/user.controller";
import { asyncHandler } from "../middleware/async-handler";

export const publicRouter = Router();

publicRouter.get("/leaderboard", asyncHandler(getPublicLeaderboardHandler));
publicRouter.post("/session-role", asyncHandler(postResolveSessionRoleHandler));
