// For client components, we use relative paths which resolve to the current origin
// For SSR, the proxy will route to the correct backend
const apiBaseUrl = "";

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

export async function requestAdminJsonWithInit<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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

export const fetchLeaderboard = () => request<LeaderboardResponse>("/public/leaderboard");

export type ArchivedLeaderboardResponse = LeaderboardResponse & {
  month: number;
  year: number;
  archivedAt: string;
};

export const fetchArchivedLeaderboard = (month: number, year: number) =>
  request<ArchivedLeaderboardResponse>(`/public/leaderboard/archived?month=${month}&year=${year}`);

export type ArchivedLeaderboardListItem = {
  month: number;
  year: number;
  archivedAt: string;
};

// This uses the public admin endpoint (no auth required, but data is admin-focused)
// Can be called from client components safely since it doesn't use next/headers
async function fetchFromPublic<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Public endpoint for listing archived leaderboards (no auth required)
export async function listArchivedLeaderboards(): Promise<ArchivedLeaderboardListItem[]> {
  const data = await fetchFromPublic<{ archives: ArchivedLeaderboardListItem[] }>("/admin/leaderboard/archived");
  return data.archives;
}

export const fetchMyUserStats = () => request<UserStatsResponse>("/user/me/stats");

export type AuditLogEntryKind = "KUDO" | "ADMIN_RESET_USER" | "ADMIN_RESET_ALL";

export type AuditLogResponse = {
  page: number;
  pageSize: number;
  total: number;
  isArchived: boolean;
  month?: number;
  year?: number;
  items: Array<{
    id: string;
    kind: AuditLogEntryKind;
    createdAt: string;
    points: number;
    message: string;
    channelId: string | null;
    channelName: string | null;
    isArchived: boolean;
    giver: { slackUserId: string; displayName: string };
    receiver: { slackUserId: string; displayName: string };
  }>;
};

export type AuditLogQueryParams = {
  page?: number;
  pageSize?: number;
  showArchived?: boolean;
  month?: number;
  year?: number;
};

/** Client-safe: sends browser session cookie; called from client components. */
export async function fetchAuditLogClient(params: AuditLogQueryParams = {}): Promise<AuditLogResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  if (params.showArchived) sp.set("showArchived", "true");
  if (params.month !== undefined) sp.set("month", String(params.month));
  if (params.year !== undefined) sp.set("year", String(params.year));
  const qs = sp.toString();
  return request<AuditLogResponse>(`/admin/audit-log${qs ? `?${qs}` : ""}`);
}
