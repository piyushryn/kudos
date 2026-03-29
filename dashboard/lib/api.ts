const apiBaseUrl = process.env.DASHBOARD_API_BASE_URL ?? "http://localhost:4000";

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (process.env.INTERNAL_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.INTERNAL_API_TOKEN}`;
  }
  return headers;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type LeaderboardResponse = {
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

export type AuditLogResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: Array<{
    id: string;
    createdAt: string;
    points: number;
    message: string;
    channelId: string | null;
    channelName: string | null;
    giver: { slackUserId: string; displayName: string };
    receiver: { slackUserId: string; displayName: string };
  }>;
};

export const fetchLeaderboard = () => request<LeaderboardResponse>("/api/leaderboard");

export const fetchUserStats = (slackUserId: string) =>
  request<UserStatsResponse>(`/api/users/${encodeURIComponent(slackUserId)}/stats`);

export const fetchAuditLog = (page = 1, pageSize = 50) =>
  request<AuditLogResponse>(`/api/audit-log?page=${page}&pageSize=${pageSize}`);
