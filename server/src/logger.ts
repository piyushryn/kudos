import pino from "pino";

import { config } from "./config";

const loggerOptions: pino.LoggerOptions = {
  name: "kudos-server",
  level: config.NODE_ENV === "production" ? "info" : "debug",
};

if (config.NODE_ENV !== "production") {
  loggerOptions.transport = {
    target: "pino-pretty",
    options: { colorize: false, translateTime: "SYS:standard" },
  };
}

export const logger = pino(loggerOptions);
