import { Router } from "express";

import {
  getPublicLeaderboardHandler,
} from "../controllers/api.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireInternalApiToken } from "../middleware/internal-auth";

export const apiRouter = Router();

apiRouter.use(requireInternalApiToken);
apiRouter.get("/leaderboard", asyncHandler(getPublicLeaderboardHandler));
