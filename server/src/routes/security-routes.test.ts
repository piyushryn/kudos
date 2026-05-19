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

vi.mock("../services/rbac.service", () => ({
  getExistingUserWithRole: vi.fn(),
  getOrCreateUserWithRole: vi.fn(),
  listRoleManagedUsers: vi.fn(),
  setUserAdminRoleBySlackId: vi.fn(),
}));

import { app } from "../app";
import {
  getAuditLog,
  getLeaderboard,
  getUserStatsBySlackId,
} from "../services/stats.service";
import { getExistingUserWithRole, listRoleManagedUsers } from "../services/rbac.service";

const mockedGetLeaderboard = vi.mocked(getLeaderboard);
const mockedGetUserStatsBySlackId = vi.mocked(getUserStatsBySlackId);
const mockedGetAuditLog = vi.mocked(getAuditLog);
const mockedGetExistingUserWithRole = vi.mocked(getExistingUserWithRole);
const mockedListRoleManagedUsers = vi.mocked(listRoleManagedUsers);

const signUserSession = (
  slackUserId: string,
  displayName: string,
  role: "user" | "admin" | "super_admin" = "user",
  exp = Math.floor(Date.now() / 1000) + 3600,
): string => {
  const payload = JSON.stringify({
    slackUserId,
    displayName,
    role,
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
    mockedGetExistingUserWithRole.mockImplementation(async (slackUserId: string) => {
      if (slackUserId === "U123") {
        return { slackUserId, displayName: "Alice", role: "user" };
      }
      if (slackUserId === "A123") {
        return { slackUserId, displayName: "Admin", role: "admin" };
      }
      if (slackUserId === "S123") {
        return { slackUserId, displayName: "Super", role: "super_admin" };
      }
      return null;
    });
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

  it("rejects admin route without authorization token", async () => {
    const res = await request(app).get("/admin/audit-log");
    expect(res.status).toBe(401);
  });

  it("allows admin route with admin role token", async () => {
    mockedGetAuditLog.mockResolvedValue({
      page: 1,
      pageSize: 25,
      total: 0,
      isArchived: false,
      month: undefined,
      year: undefined,
      items: [],
    });

    const res = await request(app)
      .get("/admin/audit-log")
      .set("authorization", `Bearer ${signUserSession("A123", "Admin", "admin")}`);

    expect(res.status).toBe(200);
    expect(mockedGetAuditLog).toHaveBeenCalledOnce();
  });

  it("rejects admin route with user role token", async () => {
    const res = await request(app)
      .get("/admin/audit-log")
      .set("authorization", `Bearer ${signUserSession("U123", "Alice", "user")}`);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });

  it("rejects user route without valid session token", async () => {
    const res = await request(app).get("/user/me/stats");
    expect(res.status).toBe(401);
  });

  it("rejects user route with unknown user in token", async () => {
    const token = signUserSession("U123", "Alice");
    mockedGetExistingUserWithRole.mockResolvedValueOnce(null);
    const res = await request(app).get("/user/me/stats").set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("rejects user route with malformed bearer token", async () => {
    const res = await request(app).get("/user/me/stats").set("authorization", "Token malformed");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("rejects user route with tampered bearer token", async () => {
    const token = `${signUserSession("U123", "Alice")}tampered`;
    const res = await request(app)
      .get("/user/me/stats")
      .set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid user session token" });
  });

  it("rejects user route with expired bearer token", async () => {
    const token = signUserSession("U123", "Alice", "user", Math.floor(Date.now() / 1000) - 1);
    const res = await request(app)
      .get("/user/me/stats")
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
    expect(res.body).toEqual({ error: "Invalid user session token" });
  });

  it("allows internal API route with valid bearer token", async () => {
    mockedGetLeaderboard.mockResolvedValue({
      topGivers: [{ userId: "1", displayName: "Alice", points: 30 }],
      topReceivers: [{ userId: "2", displayName: "Bob", points: 20 }],
    });
    const token = signUserSession("U123", "Alice", "user");
    const res = await request(app)
      .get("/api/leaderboard")
      .set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      topGivers: [{ displayName: "Alice", points: 30 }],
      topReceivers: [{ displayName: "Bob", points: 20 }],
    });
  });

  it("allows internal API route with admin role", async () => {
    mockedGetLeaderboard.mockResolvedValue({
      topGivers: [{ userId: "1", displayName: "Alice", points: 30 }],
      topReceivers: [{ userId: "2", displayName: "Bob", points: 20 }],
    });
    const token = signUserSession("A123", "Admin", "admin");
    const res = await request(app).get("/api/leaderboard").set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("rejects internal API route for unknown user", async () => {
    const token = signUserSession("UNKNOWN", "Unknown", "admin");
    const res = await request(app).get("/api/leaderboard").set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("rejects internal API route with expired token", async () => {
    const token = signUserSession("U123", "Alice", "user", Math.floor(Date.now() / 1000) - 1);
    const res = await request(app).get("/api/leaderboard").set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid user session token" });
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

  it("allows super admin to access role-management endpoint", async () => {
    mockedListRoleManagedUsers.mockResolvedValue({
      users: [],
      total: 0,
      page: 1,
      pageSize: 25,
    });
    const res = await request(app)
      .get("/admin/rbac/users")
      .set("authorization", `Bearer ${signUserSession("S123", "Super", "super_admin")}`);
    expect(res.status).toBe(200);
  });

  it("forbids admin from super-admin role-management endpoint", async () => {
    const res = await request(app)
      .get("/admin/rbac/users")
      .set("authorization", `Bearer ${signUserSession("A123", "Admin", "admin")}`);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });
});
