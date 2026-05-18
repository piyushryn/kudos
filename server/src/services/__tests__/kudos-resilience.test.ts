import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockConfig,
  balanceFindOneAndUpdateMock,
  kudosCreateMock,
  dailyCapFindOneAndUpdateMock,
  dailyCapCreateMock,
  startSessionMock,
  getOrCreateUserMock,
} = vi.hoisted(() => ({
    mockConfig: {
      MAX_KUDOS_PER_TRANSACTION: 50,
      ENABLE_DAILY_RECEIVER_CAP: false,
      DAILY_RECEIVER_CAP: undefined as number | undefined,
    },
    balanceFindOneAndUpdateMock: vi.fn(),
    kudosCreateMock: vi.fn(),
    dailyCapFindOneAndUpdateMock: vi.fn(),
    dailyCapCreateMock: vi.fn(),
    startSessionMock: vi.fn(),
    getOrCreateUserMock: vi.fn(),
  }));

vi.mock("../../config", () => ({
  config: mockConfig,
}));

vi.mock("../../db/mappers", () => ({
  asObjectId: (value: string) => value,
}));

vi.mock("../../db/models", () => ({
  UserGivingBalanceModel: {
    findOneAndUpdate: balanceFindOneAndUpdateMock,
  },
  KudosTransactionModel: {
    create: kudosCreateMock,
    startSession: startSessionMock,
  },
  ReceiverDailyCapModel: {
    findOneAndUpdate: dailyCapFindOneAndUpdateMock,
    create: dailyCapCreateMock,
  },
}));

vi.mock("../user.service", () => ({
  getOrCreateUser: getOrCreateUserMock,
}));

vi.mock("../../utils/date", () => ({
  getMonthYear: () => ({ month: 1, year: 2026 }),
  startOfUtcDay: () => new Date("2026-01-01T00:00:00.000Z"),
  endOfUtcDay: () => new Date("2026-01-01T23:59:59.999Z"),
}));

import { giveKudos } from "../kudos.service";

const asLeanQuery = <T>(value: T) => ({
  lean: () => ({
    exec: async () => value,
  }),
});

describe("giveKudos resilience gaps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.ENABLE_DAILY_RECEIVER_CAP = false;
    mockConfig.DAILY_RECEIVER_CAP = undefined;

    getOrCreateUserMock.mockImplementation(async (slackUserId: string, displayName?: string) => ({
      id: `id-${slackUserId}`,
      displayName: displayName ?? `User ${slackUserId}`,
      userCategory: { monthlyGivingQuota: null },
    }));

    startSessionMock.mockResolvedValue({
      withTransaction: async (callback: () => Promise<void>) => callback(),
      endSession: vi.fn(),
    });
    kudosCreateMock.mockResolvedValue(undefined);
    dailyCapFindOneAndUpdateMock.mockReturnValue(asLeanQuery({ points: 10 }));
    dailyCapCreateMock.mockResolvedValue(undefined);

    balanceFindOneAndUpdateMock.mockImplementation(
      (_query: unknown, update: Record<string, unknown>, options: Record<string, unknown>) => {
        if (options.upsert) {
          return {
            lean: async () => ({ _id: "balance-id", remainingPoints: 100 }),
          };
        }
        if (update.$inc) {
          return {
            lean: () => ({
              exec: async () => ({ remainingPoints: 90 }),
            }),
          };
        }
        throw new Error("Unexpected findOneAndUpdate shape");
      },
    );
  });

  it("surfaces an error after balance decrement if kudos insert fails", async () => {
    kudosCreateMock.mockRejectedValueOnce(new Error("insert failed"));

    await expect(
      giveKudos({
        giverSlackUserId: "U123",
        giverDisplayName: "giver",
        receiverSlackUserId: "U456",
        points: 10,
        message: "great work",
        slackChannelId: "C1",
        slackChannelName: "general",
      }),
    ).rejects.toThrow("insert failed");

    expect(balanceFindOneAndUpdateMock).toHaveBeenCalledTimes(2);
    expect(kudosCreateMock).toHaveBeenCalledTimes(1);
  });

  it("rejects once daily receiver cap is reached under concurrency", async () => {
    mockConfig.ENABLE_DAILY_RECEIVER_CAP = true;
    mockConfig.DAILY_RECEIVER_CAP = 10;

    dailyCapFindOneAndUpdateMock
      .mockReturnValueOnce(asLeanQuery(null))
      .mockReturnValueOnce(asLeanQuery(null))
      .mockReturnValueOnce(asLeanQuery(null));
    dailyCapCreateMock
      .mockResolvedValueOnce([{ points: 10 }])
      .mockRejectedValueOnce({ code: 11000 });

    const first = await giveKudos({
      giverSlackUserId: "U123",
      giverDisplayName: "giver-1",
      receiverSlackUserId: "U999",
      points: 10,
      message: "great work",
      slackChannelId: "C1",
      slackChannelName: "general",
    });
    expect(first.points).toBe(10);

    await expect(
      giveKudos({
        giverSlackUserId: "U124",
        giverDisplayName: "giver-2",
        receiverSlackUserId: "U999",
        points: 10,
        message: "great work",
        slackChannelId: "C1",
        slackChannelName: "general",
      }),
    ).rejects.toThrow(/daily cap/i);
  });

  it("uses fallback create path for first cap allocation", async () => {
    mockConfig.ENABLE_DAILY_RECEIVER_CAP = true;
    mockConfig.DAILY_RECEIVER_CAP = 25;
    dailyCapFindOneAndUpdateMock
      .mockReturnValueOnce(asLeanQuery(null))
      .mockReturnValueOnce(asLeanQuery({ points: 20 }));
    dailyCapCreateMock.mockResolvedValueOnce([{ points: 10 }]);

    const first = await giveKudos({
      giverSlackUserId: "U123",
      giverDisplayName: "giver-1",
      receiverSlackUserId: "U999",
      points: 10,
      message: "great work",
      slackChannelId: "C1",
      slackChannelName: "general",
    });
    const second = await giveKudos({
      giverSlackUserId: "U124",
      giverDisplayName: "giver-2",
      receiverSlackUserId: "U999",
      points: 10,
      message: "great work",
      slackChannelId: "C1",
      slackChannelName: "general",
    });

    expect(first.points).toBe(10);
    expect(second.points).toBe(10);
    expect(dailyCapCreateMock).toHaveBeenCalledTimes(1);
  });
});
