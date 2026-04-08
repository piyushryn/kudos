import { runtimeEnv } from "@/lib/runtime-env";

const apiBaseUrl = runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000";

const dashboardServiceToken = (): string => {
  const token = runtimeEnv("DASHBOARD_SERVICE_TOKEN");
  if (!token) {
    throw new Error("DASHBOARD_SERVICE_TOKEN is not set for the dashboard.");
  }
  return token;
};

async function request<T>(path: string, headers?: HeadersInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type LeaderboardResponse = {
  topGivers: Array<{ displayName: string; points: number }>;
  topReceivers: Array<{ displayName: string; points: number }>;
};

export type AdminLeaderboardResponse = {
  topGivers: Array<{ userId: string; displayName: string; points: number }>;
  topReceivers: Array<{ userId: string; displayName: string; points: number }>;
};

export type UserCategorySummary = {
  id: string;
  key: string;
  name: string;
  monthlyGivingQuota: number | null;
};

export type UserStatsResponse = {
  slackUserId: string;
  displayName: string;
  totalGiven: number;
  totalReceived: number;
  remainingBalance: number;
  userCategory: UserCategorySummary;
  effectiveMonthlyQuota: number;
  workspaceDefaultMonthlyBalance: number;
};

export async function requestAdminJson<T>(path: string): Promise<T> {
  return request<T>(path, {
    "x-dashboard-service-token": dashboardServiceToken(),
  });
}

export async function requestAdminJsonWithInit<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-dashboard-service-token": dashboardServiceToken(),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const msg =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: string }).error)
        : text || response.statusText;
    throw new Error(msg);
  }

  return body as T;
}

export type AuditLogEntryKind = "KUDO" | "ADMIN_RESET_USER" | "ADMIN_RESET_ALL";

export type AuditLogResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: Array<{
    id: string;
    kind: AuditLogEntryKind;
    createdAt: string;
    points: number;
    message: string;
    channelId: string | null;
    channelName: string | null;
    giver: { slackUserId: string; displayName: string };
    receiver: { slackUserId: string; displayName: string };
  }>;
};

export const fetchLeaderboard = () => request<LeaderboardResponse>("/public/leaderboard");
export const fetchAdminLeaderboard = () =>
  request<AdminLeaderboardResponse>("/admin/leaderboard", {
    "x-dashboard-service-token": dashboardServiceToken(),
  });

export const fetchMyUserStats = (userSessionToken: string) =>
  request<UserStatsResponse>("/user/me/stats", {
    Authorization: `Bearer ${userSessionToken}`,
    "x-dashboard-service-token": dashboardServiceToken(),
  });

export const fetchAuditLog = (page = 1, pageSize = 50) =>
  request<AuditLogResponse>(`/admin/audit-log?page=${page}&pageSize=${pageSize}`, {
    "x-dashboard-service-token": dashboardServiceToken(),
  });
