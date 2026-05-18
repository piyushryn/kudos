import { Router } from "express";

import { getMyStatsHandler } from "../controllers/user.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireRbacAuth } from "../middleware/rbac-auth";

export const userRouter = Router();

userRouter.use(requireRbacAuth(["user", "admin", "super_admin"]));
userRouter.get("/me/stats", asyncHandler(getMyStatsHandler));
