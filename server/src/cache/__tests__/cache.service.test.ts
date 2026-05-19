import RedisMock from "ioredis-mock";
import type { Redis } from "ioredis";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { __setRedisForTests } from "../redis";
import {
  delByPrefix,
  del,
  getJson,
  setJson,
  withCache,
} from "../cache.service";

const buildClient = (): Redis => new RedisMock() as unknown as Redis;

let mock: Redis;

beforeEach(() => {
  mock = buildClient();
  __setRedisForTests(mock);
});

afterEach(async () => {
  __setRedisForTests(null);
  await mock.flushall();
  mock.disconnect();
});

describe("cache.service get/set/del", () => {
  it("getJson returns null on miss and round-trips via setJson", async () => {
    expect(await getJson("k1")).toBeNull();
    await setJson("k1", { hello: "world" }, 30);
    expect(await getJson("k1")).toEqual({ hello: "world" });
  });

  it("setJson honors TTL", async () => {
    await setJson("k:ttl", 42, 10);
    const pttl = await mock.pttl("k:ttl");
    expect(pttl).toBeGreaterThan(0);
    expect(pttl).toBeLessThanOrEqual(10_000);
  });

  it("del removes only the specified keys", async () => {
    await setJson("a", 1, 60);
    await setJson("b", 2, 60);
    await setJson("c", 3, 60);
    const removed = await del("a", "b");
    expect(removed).toBe(2);
    expect(await getJson("a")).toBeNull();
    expect(await getJson("b")).toBeNull();
    expect(await getJson("c")).toBe(3);
  });
});

describe("cache.service delByPrefix", () => {
  it("removes all keys with the prefix and leaves others intact", async () => {
    const setup = [
      ...Array.from({ length: 50 }, (_, i) => mock.set(`pfx:keep:${i}`, "x")),
      ...Array.from({ length: 1200 }, (_, i) => mock.set(`pfx:bust:${i}`, "x")),
    ];
    await Promise.all(setup);

    const removed = await delByPrefix("pfx:bust:");
    expect(removed).toBe(1200);

    const keepCount = await mock.keys("pfx:keep:*");
    expect(keepCount.length).toBe(50);

    const bustCount = await mock.keys("pfx:bust:*");
    expect(bustCount.length).toBe(0);
  });

  it("returns 0 when nothing matches", async () => {
    expect(await delByPrefix("does:not:exist:")).toBe(0);
  });
});

describe("cache.service withCache", () => {
  it("invokes loader on miss, caches, and skips loader on hit", async () => {
    const loader = vi.fn().mockResolvedValue({ v: 1 });
    const first = await withCache("wc:1", 60, loader);
    const second = await withCache("wc:1", 60, loader);
    expect(first).toEqual({ v: 1 });
    expect(second).toEqual({ v: 1 });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("propagates loader rejection and stores nothing", async () => {
    const loader = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(withCache("wc:err", 60, loader)).rejects.toThrow("boom");
    expect(await getJson("wc:err")).toBeNull();
  });
});
