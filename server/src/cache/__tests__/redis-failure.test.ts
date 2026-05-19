import RedisMock from "ioredis-mock";
import type { Redis } from "ioredis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __setRedisForTests } from "../redis";
import { del, delByPrefix, getJson, setJson, withCache } from "../cache.service";

/**
 * These tests cover the resilience contract: when Redis is configured but
 * the underlying client throws (transient network failure, broken pipe,
 * etc.), the cache helpers must log and fall back — they must NOT propagate
 * errors to request handlers.
 */

const buildBrokenClient = (): Redis => {
  const client = new RedisMock() as unknown as Redis;
  // Force every command to throw without taking down the process.
  const fail = vi.fn(() => Promise.reject(new Error("simulated Redis failure")));
  (client as unknown as Record<string, unknown>).get = fail;
  (client as unknown as Record<string, unknown>).set = fail;
  (client as unknown as Record<string, unknown>).unlink = fail;
  (client as unknown as Record<string, unknown>).scan = fail;
  return client;
};

let broken: Redis;

beforeEach(() => {
  broken = buildBrokenClient();
  __setRedisForTests(broken);
});

afterEach(() => {
  __setRedisForTests(null);
});

describe("cache.service resilience when Redis errors", () => {
  it("getJson returns null on read error", async () => {
    await expect(getJson("any")).resolves.toBeNull();
  });

  it("setJson swallows write errors", async () => {
    await expect(setJson("any", { a: 1 }, 30)).resolves.toBeUndefined();
  });

  it("del returns 0 on error", async () => {
    await expect(del("any")).resolves.toBe(0);
  });

  it("delByPrefix returns 0 on error", async () => {
    await expect(delByPrefix("any:")).resolves.toBe(0);
  });

  it("withCache falls through to loader and returns its value", async () => {
    const loader = vi.fn().mockResolvedValue({ ok: true });
    await expect(withCache("any", 30, loader)).resolves.toEqual({ ok: true });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("recovers after the client becomes healthy again", async () => {
    // Swap in a working mock and verify caching resumes end-to-end.
    const healthy = new RedisMock() as unknown as Redis;
    __setRedisForTests(healthy);

    await setJson("recovery", { v: 7 }, 30);
    await expect(getJson<{ v: number }>("recovery")).resolves.toEqual({ v: 7 });

    healthy.disconnect();
  });
});
