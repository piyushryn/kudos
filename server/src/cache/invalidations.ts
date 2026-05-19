import { delByPrefix } from "./cache.service";
import { AUDIT_LOG_ACTIVE_PREFIX, LEADERBOARD_CURRENT_PREFIX } from "./keys";
import { logger } from "../logger";

const invalidationLogger = logger.child({ subsystem: "cache", area: "leaderboard-invalidation" });

/**
 * Invalidates every cached current-month leaderboard variant. Safe to call
 * frequently — when Redis is disabled or unhealthy this is a logged no-op.
 * Never throws so it can be invoked from hot write paths and Mongoose hooks.
 */
export const invalidateCurrentLeaderboard = async (
  reason: string,
): Promise<void> => {
  try {
    const removed = await delByPrefix(LEADERBOARD_CURRENT_PREFIX);
    if (removed > 0) {
      invalidationLogger.debug({ reason, removed }, "Current-month leaderboard cache invalidated.");
    }
  } catch (err) {
    invalidationLogger.warn({ err, reason }, "Leaderboard cache invalidation failed.");
  }
};

/**
 * Invalidates every cached active (non-archived) audit-log page. Same
 * fail-safe semantics as `invalidateCurrentLeaderboard`.
 */
export const invalidateAuditLog = async (reason: string): Promise<void> => {
  try {
    const removed = await delByPrefix(AUDIT_LOG_ACTIVE_PREFIX);
    if (removed > 0) {
      invalidationLogger.debug({ reason, removed }, "Active audit-log cache invalidated.");
    }
  } catch (err) {
    invalidationLogger.warn({ err, reason }, "Audit-log cache invalidation failed.");
  }
};

/**
 * Convenience helper for write paths that affect both surfaces (manual /
 * cron monthly reset, leaderboard resets). Both helpers swallow their own
 * errors; we run them in parallel so a slow Redis can't double the latency.
 */
export const invalidateAllKudosCaches = async (reason: string): Promise<void> => {
  await Promise.all([
    invalidateCurrentLeaderboard(reason),
    invalidateAuditLog(reason),
  ]);
};
