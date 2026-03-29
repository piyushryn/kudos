import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  SLACK_SIGNING_SECRET: z.string().min(1),
  SLACK_BOT_TOKEN: z.string().min(1),
  DEFAULT_MONTHLY_BALANCE: z.coerce.number().int().positive().default(100),
  MAX_KUDOS_PER_TRANSACTION: z.coerce.number().int().positive().default(50),
  DAILY_RECEIVER_CAP: z.coerce.number().int().positive().optional(),
  ENABLE_DAILY_RECEIVER_CAP: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  ENABLE_MANUAL_MONTHLY_RESET: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CRON_MONTHLY_RESET: z.string().default("0 2 1 * *"),
  INTERNAL_API_TOKEN: z.string().min(1).optional(),
  DASHBOARD_API_BASE_URL: z.url().optional(),
  SLACK_VERBOSE_LOGGING: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export const config = envSchema.parse(process.env);
