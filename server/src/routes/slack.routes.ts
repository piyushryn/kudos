import { Router } from "express";

import { handleSlackCommand } from "../controllers/slack.controller";
import { asyncHandler } from "../middleware/async-handler";
import { slackInboundLogMiddleware } from "../middleware/slack-inbound-log";
import { verifySlackSignatureMiddleware } from "../middleware/slack-verify";

export const slackRouter = Router();

slackRouter.post(
  "/commands",
  slackInboundLogMiddleware,
  verifySlackSignatureMiddleware,
  asyncHandler(handleSlackCommand),
);
