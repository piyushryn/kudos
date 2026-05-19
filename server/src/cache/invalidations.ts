import { delByPrefix } from "./cache.service";
import { LEADERBOARD_CURRENT_PREFIX } from "./keys";
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
