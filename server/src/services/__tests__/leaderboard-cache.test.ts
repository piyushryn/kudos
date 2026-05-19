import RedisMock from "ioredis-mock";
import type { Redis } from "ioredis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __setRedisForTests } from "../../cache/redis";
import { invalidateCurrentLeaderboard } from "../../cache/invalidations";
import { publicLeaderboardKey } from "../../cache/keys";
import { kudosRepository } from "../../db/kudos.repository";
import { UserModel } from "../../db/models";
import { getLeaderboard } from "../stats.service";

const noUsers = {
  lean: () => ({ exec: () => Promise.resolve([]) }),
} as unknown as ReturnType<typeof UserModel.find>;

const mockUserModelFind = () => {
  return vi.spyOn(UserModel, "find").mockReturnValue(noUsers);
};

let mock: Redis;

beforeEach(() => {
  mock = new RedisMock() as unknown as Redis;
  __setRedisForTests(mock);
});

afterEach(async () => {
  __setRedisForTests(null);
  await mock.flushall();
  mock.disconnect();
  vi.restoreAllMocks();
});

describe("getLeaderboard caching", () => {
  // Repo IDs are converted via asObjectId(), so they must be valid 24-char hex.
  const ID_A = "507f1f77bcf86cd799439011";
  const ID_B = "507f1f77bcf86cd799439012";

  it("hits the cache on the second call for the same limit", async () => {
    const giversSpy = vi
      .spyOn(kudosRepository, "groupTopGivers")
      .mockResolvedValue([{ giverId: ID_A, _sum: { points: 5 } }]);
    const receiversSpy = vi
      .spyOn(kudosRepository, "groupTopReceivers")
      .mockResolvedValue([{ receiverId: ID_B, _sum: { points: 7 } }]);
    const findSpy = mockUserModelFind();

    const first = await getLeaderboard(10);
    const second = await getLeaderboard(10);

    expect(first).toEqual(second);
    expect(giversSpy).toHaveBeenCalledTimes(1);
    expect(receiversSpy).toHaveBeenCalledTimes(1);
    // UserModel.find runs at most once because the second call is a pure
    // cache hit and never reaches the loader.
    expect(findSpy).toHaveBeenCalledTimes(1);
  });

  it("uses distinct cache entries per limit", async () => {
    const giversSpy = vi
      .spyOn(kudosRepository, "groupTopGivers")
      .mockResolvedValue([]);
    vi.spyOn(kudosRepository, "groupTopReceivers").mockResolvedValue([]);
    mockUserModelFind();

    await getLeaderboard(10);
    await getLeaderboard(25);
    await getLeaderboard(10);
    await getLeaderboard(25);

    // Each unique limit runs the aggregation exactly once.
    expect(giversSpy).toHaveBeenCalledTimes(2);
  });

  it("invalidateCurrentLeaderboard clears cached entries", async () => {
    const giversSpy = vi
      .spyOn(kudosRepository, "groupTopGivers")
      .mockResolvedValue([]);
    vi.spyOn(kudosRepository, "groupTopReceivers").mockResolvedValue([]);
    mockUserModelFind();

    await getLeaderboard(10);
    expect(giversSpy).toHaveBeenCalledTimes(1);

    await invalidateCurrentLeaderboard("test");

    await getLeaderboard(10);
    expect(giversSpy).toHaveBeenCalledTimes(2);
  });

  it("writes the expected cache key", async () => {
    vi.spyOn(kudosRepository, "groupTopGivers").mockResolvedValue([]);
    vi.spyOn(kudosRepository, "groupTopReceivers").mockResolvedValue([]);
    mockUserModelFind();

    await getLeaderboard(10);

    const raw = await mock.get(publicLeaderboardKey(10));
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({ topGivers: [], topReceivers: [] });
  });
});
