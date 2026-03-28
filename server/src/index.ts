import { app } from "./app";
import { config } from "./config";
import { scheduleMonthlyResetJob } from "./jobs/monthly-reset";
import { logger } from "./logger";

app.listen(config.PORT, () => {
  scheduleMonthlyResetJob();
  logger.info({ port: config.PORT }, "Kudos server listening.");
});
