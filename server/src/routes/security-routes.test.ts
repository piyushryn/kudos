import { createHmac } from "crypto";

import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@prisma/client", () => ({
  PrismaClient: class PrismaClient {},
  KudosEntryKind: {
    KUDO: "KUDO",
    ADMIN_RESET_USER: "ADMIN_RESET_USER",
    ADMIN_RESET_ALL: "ADMIN_RESET_ALL",
  },
}));

vi.mock("../services/stats.service", () => ({
  getLeaderboard: vi.fn(),
  getUserStatsBySlackId: vi.fn(),
  getUserStatsForSlackId: vi.fn(),
  getCurrentMonthStats: vi.fn(),
  getAuditLog: vi.fn(),
}));

import { app } from "../app";
import {
  getAuditLog,
  getLeaderboard,
  getUserStatsForSlackId,
} from "../services/stats.service";

const mockedGetLeaderboard = vi.mocked(getLeaderboard);
const mockedGetUserStatsForSlackId = vi.mocked(getUserStatsForSlackId);
const mockedGetAuditLog = vi.mocked(getAuditLog);

const signUserSession = (slackUserId: string, displayName: string): string => {
  const payload = JSON.stringify({
    slackUserId,
    displayName,
    exp: Math.floor(Date.now() / 1000) + 3600,
    v: 1,
  });
  const secret = process.env.USER_SESSION_SIGNING_SECRET as string;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
};

describe("security route boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows public leaderboard without auth", async () => {
    mockedGetLeaderboard.mockResolvedValue({
      topGivers: [{ userId: "1", displayName: "Alice", points: 30 }],
      topReceivers: [{ userId: "2", displayName: "Bob", points: 20 }],
    });

    const res = await request(app).get("/public/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      topGivers: [{ displayName: "Alice", points: 30 }],
      topReceivers: [{ displayName: "Bob", points: 20 }],
    });
  });

  it("rejects admin route without dashboard service token", async () => {
    const res = await request(app).get("/admin/audit-log");
    expect(res.status).toBe(401);
  });

  it("allows admin route with dashboard service token", async () => {
    mockedGetAuditLog.mockResolvedValue({
      page: 1,
      pageSize: 25,
      total: 0,
      items: [],
    });

    const res = await request(app)
      .get("/admin/audit-log")
      .set("x-dashboard-service-token", process.env.DASHBOARD_SERVICE_TOKEN as string);

    expect(res.status).toBe(200);
    expect(mockedGetAuditLog).toHaveBeenCalledOnce();
  });

  it("rejects user route without valid session token", async () => {
    const res = await request(app)
      .get("/user/me/stats")
      .set("x-dashboard-service-token", process.env.DASHBOARD_SERVICE_TOKEN as string);
    expect(res.status).toBe(401);
  });

  it("returns only authenticated user stats on /user/me/stats", async () => {
    mockedGetUserStatsForSlackId.mockResolvedValue({
      slackUserId: "U123",
      displayName: "Alice",
      totalGiven: 10,
      totalReceived: 20,
      remainingBalance: 70,
      userCategory: {
        id: "cat1",
        key: "employee",
        name: "Employee",
        monthlyGivingQuota: 100,
      },
      effectiveMonthlyQuota: 100,
      workspaceDefaultMonthlyBalance: 100,
    });

    const token = signUserSession("U123", "Alice");
    const res = await request(app)
      .get("/user/me/stats")
      .set("x-dashboard-service-token", process.env.DASHBOARD_SERVICE_TOKEN as string)
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(mockedGetUserStatsForSlackId).toHaveBeenCalledWith("U123");
    expect(res.body.slackUserId).toBe("U123");
  });
});
