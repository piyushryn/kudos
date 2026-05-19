import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __setRedisForTests } from "../redis";
import { del, delByPrefix, getJson, setJson, withCache } from "../cache.service";

// REDIS_URL is unset in test setup, so getRedis() naturally returns null.
// Explicitly clear any test override to be safe.
beforeEach(() => {
  __setRedisForTests(null);
});

afterEach(() => {
  __setRedisForTests(null);
});

describe("cache.service when Redis is disabled", () => {
  it("getJson returns null without throwing", async () => {
    await expect(getJson("anything")).resolves.toBeNull();
  });

  it("setJson is a silent no-op", async () => {
    await expect(setJson("anything", { a: 1 }, 30)).resolves.toBeUndefined();
  });

  it("del returns 0 without throwing", async () => {
    await expect(del("a", "b")).resolves.toBe(0);
  });

  it("delByPrefix returns 0 without throwing", async () => {
    await expect(delByPrefix("pfx:")).resolves.toBe(0);
  });

  it("withCache invokes loader every call and returns its value", async () => {
    const loader = vi.fn().mockResolvedValue("hello");
    await expect(withCache("k", 30, loader)).resolves.toBe("hello");
    await expect(withCache("k", 30, loader)).resolves.toBe("hello");
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
