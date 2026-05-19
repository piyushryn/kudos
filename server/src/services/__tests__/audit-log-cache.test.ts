import RedisMock from "ioredis-mock";
import type { Redis } from "ioredis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __setRedisForTests } from "../../cache/redis";
import { invalidateAuditLog } from "../../cache/invalidations";
import { auditLogActiveKey } from "../../cache/keys";
import { KudosTransactionModel } from "../../db/models";
import { getAuditLog } from "../stats.service";

let mock: Redis;

const stubFindQuery = () =>
  ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          populate: () => ({
            populate: () => ({
              lean: () => ({ exec: () => Promise.resolve([]) }),
            }),
          }),
        }),
      }),
    }),
  }) as unknown as ReturnType<typeof KudosTransactionModel.find>;

const stubModel = () => {
  const findSpy = vi.spyOn(KudosTransactionModel, "find").mockReturnValue(stubFindQuery());
  const countSpy = vi
    .spyOn(KudosTransactionModel, "countDocuments")
    .mockResolvedValue(0 as never);
  return { findSpy, countSpy };
};

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

describe("getAuditLog caching", () => {
  it("hits the cache on the second call for the same page/size (default active view)", async () => {
    const { findSpy, countSpy } = stubModel();

    const first = await getAuditLog(1, 20, {});
    const second = await getAuditLog(1, 20, {});

    expect(first).toEqual(second);
    expect(findSpy).toHaveBeenCalledTimes(1);
    expect(countSpy).toHaveBeenCalledTimes(1);
  });

  it("uses distinct cache entries per (page, pageSize)", async () => {
    const { findSpy } = stubModel();

    await getAuditLog(1, 20, {});
    await getAuditLog(2, 20, {});
    await getAuditLog(1, 20, {});
    await getAuditLog(2, 20, {});
    await getAuditLog(1, 25, {});

    expect(findSpy).toHaveBeenCalledTimes(3);
  });

  it("bypasses the cache for archived queries", async () => {
    const { findSpy } = stubModel();

    await getAuditLog(1, 20, { isArchived: true, month: 4, year: 2026 });
    await getAuditLog(1, 20, { isArchived: true, month: 4, year: 2026 });

    expect(findSpy).toHaveBeenCalledTimes(2);
  });

  it("invalidateAuditLog clears cached entries", async () => {
    const { findSpy } = stubModel();

    await getAuditLog(1, 20, {});
    expect(findSpy).toHaveBeenCalledTimes(1);

    await invalidateAuditLog("test");

    await getAuditLog(1, 20, {});
    expect(findSpy).toHaveBeenCalledTimes(2);
  });

  it("writes the expected cache key for the active view", async () => {
    stubModel();

    await getAuditLog(1, 20, {});

    const raw = await mock.get(auditLogActiveKey(1, 20));
    expect(raw).not.toBeNull();
  });
});
