import { createHmac } from "crypto";

import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  getUserStatsBySlackId,
} from "../services/stats.service";

const mockedGetLeaderboard = vi.mocked(getLeaderboard);
const mockedGetUserStatsBySlackId = vi.mocked(getUserStatsBySlackId);
const mockedGetAuditLog = vi.mocked(getAuditLog);

const signUserSession = (
  slackUserId: string,
  displayName: string,
  exp = Math.floor(Date.now() / 1000) + 3600,
): string => {
  const payload = JSON.stringify({
    slackUserId,
    displayName,
    exp,
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

  it("rejects user route with missing dashboard token even with valid bearer", async () => {
    const token = signUserSession("U123", "Alice");
    const res = await request(app).get("/user/me/stats").set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("rejects user route with wrong dashboard token", async () => {
    const token = signUserSession("U123", "Alice");
    const res = await request(app)
      .get("/user/me/stats")
      .set("x-dashboard-service-token", "wrong-token")
      .set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("rejects user route with malformed bearer token", async () => {
    const res = await request(app)
      .get("/user/me/stats")
      .set("x-dashboard-service-token", process.env.DASHBOARD_SERVICE_TOKEN as string)
      .set("authorization", "Token malformed");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing user session token" });
  });

  it("rejects user route with tampered bearer token", async () => {
    const token = `${signUserSession("U123", "Alice")}tampered`;
    const res = await request(app)
      .get("/user/me/stats")
      .set("x-dashboard-service-token", process.env.DASHBOARD_SERVICE_TOKEN as string)
      .set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid user session token" });
  });

  it("rejects user route with expired bearer token", async () => {
    const token = signUserSession("U123", "Alice", Math.floor(Date.now() / 1000) - 1);
    const res = await request(app)
      .get("/user/me/stats")
      .set("x-dashboard-service-token", process.env.DASHBOARD_SERVICE_TOKEN as string)
      .set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid user session token" });
  });

  it("returns only authenticated user stats on /user/me/stats", async () => {
    mockedGetUserStatsBySlackId.mockResolvedValue({
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
    expect(mockedGetUserStatsBySlackId).toHaveBeenCalledWith("U123", "Alice");
    expect(res.body.slackUserId).toBe("U123");
  });

  it("rejects internal API route without authorization", async () => {
    const res = await request(app).get("/api/leaderboard");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("rejects internal API route with wrong auth scheme", async () => {
    const res = await request(app).get("/api/leaderboard").set("authorization", "Token not-bearer");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("rejects internal API route with wrong bearer token", async () => {
    const res = await request(app)
      .get("/api/leaderboard")
      .set("authorization", "Bearer wrong-internal-token");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("allows internal API route with valid bearer token", async () => {
    mockedGetLeaderboard.mockResolvedValue({
      topGivers: [{ userId: "1", displayName: "Alice", points: 30 }],
      topReceivers: [{ userId: "2", displayName: "Bob", points: 20 }],
    });
    const res = await request(app)
      .get("/api/leaderboard")
      .set("authorization", `Bearer ${process.env.INTERNAL_API_TOKEN as string}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      topGivers: [{ displayName: "Alice", points: 30 }],
      topReceivers: [{ displayName: "Bob", points: 20 }],
    });
  });

  it("enforces admin token across high-risk endpoints", async () => {
    const endpoints = [
      { method: "post", path: "/admin/balances/reset-all", body: undefined },
      { method: "post", path: "/admin/leaderboard/reset-all", body: undefined },
      { method: "post", path: "/admin/users/bulk-category", body: { slackUserIds: [], userCategoryId: "x" } },
      { method: "post", path: "/admin/users/U123/reset-balance", body: undefined },
    ] as const;

    for (const endpoint of endpoints) {
      const req = request(app)[endpoint.method](endpoint.path);
      const res = endpoint.body ? await req.send(endpoint.body) : await req;
      expect(res.status, endpoint.path).toBe(401);
      expect(res.body, endpoint.path).toEqual({ error: "Unauthorized" });
    }
  });
});
