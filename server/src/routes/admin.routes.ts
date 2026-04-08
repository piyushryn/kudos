import { Router } from "express";

import {
  getAdminLeaderboardHandler,
  getAuditLogHandler,
} from "../controllers/api.controller";
import {
  assignSlackUserCategoryHandler,
  listAdminUsersHandler,
  postBulkCategoryHandler,
  postResetAllBalancesHandler,
  postResetUserBalanceHandler,
} from "../controllers/admin-balance.controller";
import {
  postResetLeaderboardAllHandler,
  postResetLeaderboardUserHandler,
} from "../controllers/admin-leaderboard.controller";
import {
  deleteUserCategoryHandler,
  listUserCategoriesHandler,
  patchUserCategoryHandler,
  postUserCategoryHandler,
} from "../controllers/admin-user-category.controller";
import { runMonthlyResetHandler } from "../controllers/admin.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requireDashboardServiceToken } from "../middleware/dashboard-auth";

export const adminRouter = Router();

adminRouter.use(requireDashboardServiceToken);
adminRouter.get("/audit-log", asyncHandler(getAuditLogHandler));
adminRouter.get("/leaderboard", asyncHandler(getAdminLeaderboardHandler));
adminRouter.post("/monthly-reset", asyncHandler(runMonthlyResetHandler));

adminRouter.get("/user-categories", asyncHandler(listUserCategoriesHandler));
adminRouter.post("/user-categories", asyncHandler(postUserCategoryHandler));
adminRouter.patch("/user-categories/:id", asyncHandler(patchUserCategoryHandler));
adminRouter.delete("/user-categories/:id", asyncHandler(deleteUserCategoryHandler));

adminRouter.get("/users", asyncHandler(listAdminUsersHandler));
adminRouter.patch("/users/:slackUserId/category", asyncHandler(assignSlackUserCategoryHandler));
adminRouter.post("/users/:slackUserId/reset-balance", asyncHandler(postResetUserBalanceHandler));
adminRouter.post("/users/bulk-category", asyncHandler(postBulkCategoryHandler));
adminRouter.post("/balances/reset-all", asyncHandler(postResetAllBalancesHandler));
adminRouter.post("/leaderboard/reset-all", asyncHandler(postResetLeaderboardAllHandler));
adminRouter.post("/leaderboard/reset-user", asyncHandler(postResetLeaderboardUserHandler));
