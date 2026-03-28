import { Router } from "express";

import { runMonthlyResetHandler } from "../controllers/admin.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireInternalApiToken } from "../middleware/internal-auth";

export const adminRouter = Router();

adminRouter.use(requireInternalApiToken);
adminRouter.post("/monthly-reset", asyncHandler(runMonthlyResetHandler));
