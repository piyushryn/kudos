import { Router } from "express";

import { handleSlackCommand } from "../controllers/slack.controller";
import { asyncHandler } from "../middleware/async-handler";
import { verifySlackSignatureMiddleware } from "../middleware/slack-verify";

export const slackRouter = Router();

slackRouter.post("/commands", verifySlackSignatureMiddleware, asyncHandler(handleSlackCommand));
