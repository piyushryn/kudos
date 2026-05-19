import { logger } from "../logger";
import { getRedis } from "./redis";

const cacheLogger = logger.child({ subsystem: "cache" });

/**
 * Every helper here is failure-tolerant: when Redis is disabled, unhealthy,
 * or throws, the helper logs and returns a safe fallback so callers can
 * proceed without caching. Cache errors MUST never propagate to handlers.
 */

export const getJson = async <T>(key: string): Promise<T | null> => {
  const client = getRedis();
  if (!client) {
    return null;
  }
  try {
    const raw = await client.get(key);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    cacheLogger.warn({ err, key }, "cache.getJson failed; treating as miss.");
    return null;
  }
};

export const setJson = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  const client = getRedis();
  if (!client) {
    return;
  }
  try {
    const payload = JSON.stringify(value);
    await client.set(key, payload, "EX", ttlSeconds);
  } catch (err) {
    cacheLogger.warn({ err, key }, "cache.setJson failed; cache write skipped.");
  }
};

export const del = async (...keys: string[]): Promise<number> => {
  if (keys.length === 0) {
    return 0;
  }
  const client = getRedis();
  if (!client) {
    return 0;
  }
  try {
    return await client.unlink(...keys);
  } catch (err) {
    cacheLogger.warn({ err, keys }, "cache.del failed.");
    return 0;
  }
};

/**
 * Deletes every key with the given prefix using SCAN to gather matches and
 * UNLINK to remove them in batches. Gather-then-delete avoids the cursor
 * drift that can happen when keys are unlinked between SCAN iterations.
 * Safe to call when Redis is disabled or unhealthy (no-op, returns 0).
 */
export const delByPrefix = async (prefix: string): Promise<number> => {
  const client = getRedis();
  if (!client) {
    return 0;
  }
  const matches: string[] = [];
  let cursor = "0";
  try {
    do {
      const [nextCursor, batch] = await client.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 500);
      cursor = nextCursor;
      if (batch.length > 0) {
        matches.push(...batch);
      }
    } while (cursor !== "0");

    if (matches.length === 0) {
      return 0;
    }

    let removed = 0;
    const CHUNK = 1000;
    for (let i = 0; i < matches.length; i += CHUNK) {
      removed += await client.unlink(...matches.slice(i, i + CHUNK));
    }
    return removed;
  } catch (err) {
    cacheLogger.warn({ err, prefix }, "cache.delByPrefix failed.");
    return 0;
  }
};

/**
 * Read-through cache. On miss (or any cache-layer error) runs `loader`,
 * stores the result with `ttlSeconds`, and returns it. Cache failures never
 * prevent the loader's result from being returned to the caller.
 */
export const withCache = async <T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> => {
  const cached = await getJson<T>(key);
  if (cached !== null) {
    return cached;
  }
  const value = await loader();
  await setJson(key, value, ttlSeconds);
  return value;
};
