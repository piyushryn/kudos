import type { NextFunction, Request, Response } from "express";

import { logSlackCommandInbound } from "../slack/command-logging";

export const slackInboundLogMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  logSlackCommandInbound(req);
  next();
};
