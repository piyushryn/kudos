import { app } from "./app";
import { disconnectRedis, getRedis } from "./cache/redis";
import { config } from "./config";
import { connectToDatabase, disconnectFromDatabase } from "./db/mongodb";
import { scheduleMonthlyResetJob } from "./jobs/monthly-reset";
import { logger } from "./logger";

const boot = async (): Promise<void> => {
  await connectToDatabase();
  // Eagerly initialize Redis so connect/error events are logged at startup.
  // A missing or broken Redis must not block boot; getRedis() simply returns
  // null and cache helpers degrade to no-ops.
  getRedis();

  const server = app.listen(config.PORT, () => {
    scheduleMonthlyResetJob();
    logger.info({ port: config.PORT }, "Kudos server listening.");
  });

  const shutdown = async (): Promise<void> => {
    server.close(async () => {
      await disconnectRedis();
      await disconnectFromDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

boot().catch((error) => {
  logger.error({ err: error }, "Failed to start server.");
  process.exit(1);
});
