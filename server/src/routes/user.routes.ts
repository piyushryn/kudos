import { Router } from "express";

import { getMyStatsHandler } from "../controllers/user.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireUserSessionAuth } from "../middleware/dashboard-auth";

export const userRouter = Router();

userRouter.use(requireUserSessionAuth);
userRouter.get("/me/stats", asyncHandler(getMyStatsHandler));
