import IORedis, { type Redis, type RedisOptions } from "ioredis";

import { config } from "../config";
import { logger } from "../logger";

const redisLogger = logger.child({ subsystem: "redis" });

type CacheClient = {
  /** ioredis instance when configured; null when disabled. */
  client: Redis | null;
  /**
   * True while the connection is usable. Flips to false on `error`/`end`
   * events and back to true on `ready`. Cache helpers short-circuit when
   * this is false so Redis hiccups can never cascade into request failures.
   */
  healthy: boolean;
  /** Test-only override: when set, replaces the live client entirely. */
  override: Redis | null;
};

const state: CacheClient = {
  client: null,
  healthy: false,
  override: null,
};

let lastErrorLogged = 0;
const ERROR_LOG_DEDUP_MS = 60_000;

const logRedisError = (err: unknown, context: string): void => {
  const now = Date.now();
  if (now - lastErrorLogged < ERROR_LOG_DEDUP_MS) {
    return;
  }
  lastErrorLogged = now;
  redisLogger.warn({ err, context }, "Redis cache layer unhealthy; falling back to direct DB reads.");
};

const initClient = (): Redis | null => {
  if (!config.REDIS_URL) {
    redisLogger.info("REDIS_URL not set — cache layer disabled.");
    return null;
  }

  try {
    const options: RedisOptions = {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(2000, 200 * Math.max(1, times)),
    };
    const client = new IORedis(config.REDIS_URL, options);

    client.on("ready", () => {
      state.healthy = true;
      lastErrorLogged = 0;
      redisLogger.info("Redis ready — cache layer enabled.");
    });
    client.on("error", (err) => {
      state.healthy = false;
      logRedisError(err, "client_error_event");
    });
    client.on("end", () => {
      state.healthy = false;
      redisLogger.warn("Redis connection ended.");
    });

    return client;
  } catch (err) {
    // Constructor itself failed (bad URL etc.). Log and degrade to no-op.
    logRedisError(err, "client_init_failed");
    return null;
  }
};

/**
 * Returns the active Redis client, or null when Redis is disabled, the
 * connection is unhealthy, or initialization failed.
 *
 * Callers MUST treat a null return as "cache unavailable" and proceed
 * without caching. They MUST NOT throw on this path.
 */
export const getRedis = (): Redis | null => {
  if (state.override) {
    return state.override;
  }
  if (state.client === null && !state.healthy) {
    state.client = initClient();
  }
  if (!state.client || !state.healthy) {
    return null;
  }
  return state.client;
};

export const isCacheHealthy = (): boolean => Boolean(state.override) || state.healthy;

export const disconnectRedis = async (): Promise<void> => {
  const client = state.client;
  state.client = null;
  state.healthy = false;
  if (!client) {
    return;
  }
  try {
    await client.quit();
  } catch (err) {
    redisLogger.warn({ err }, "Error while closing Redis connection.");
    client.disconnect();
  }
};

/**
 * Test-only: inject a fake client (e.g. ioredis-mock). Pass null to clear.
 * Marks the cache healthy so helpers exercise the real code paths.
 */
export const __setRedisForTests = (client: Redis | null): void => {
  state.override = client;
  state.healthy = client !== null;
  lastErrorLogged = 0;
};
