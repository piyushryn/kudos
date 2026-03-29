import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

import { apiRouter } from "./routes/api.routes";
import { adminRouter } from "./routes/admin.routes";
import { slackRouter } from "./routes/slack.routes";
import { errorHandler } from "./middleware/error-handler";
import { logger } from "./logger";

export const app = express();

// Behind nginx / Cloudflare; required so express-rate-limit accepts X-Forwarded-For
app.set("trust proxy", true);

app.use(
  pinoHttp({
    logger,
  }),
);
app.use(cors());
app.use(
  express.json({
    limit: "1mb",
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    verify: (req, _res, buf) => {
      (req as express.Request).rawBody = buf.toString();
    },
  }),
);

const slackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/slack", slackLimiter, slackRouter);
app.use("/api", apiRouter);
app.use("/admin", adminRouter);
app.use(errorHandler);
