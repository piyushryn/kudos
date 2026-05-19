// Client-callable API helpers. All requests go through the Next.js
// proxy at /api/backend/* (see app/api/backend/[...path]/route.ts), which
// forwards the browser session cookie to the Express backend. This keeps
// the backend off the public network while preserving its existing RBAC.

const PROXY_PREFIX = "/api/backend";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${PROXY_PREFIX}${path}`, {
    headers: { "Content-Type": "application/json" },
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

export type ArchivedLeaderboardResponse = LeaderboardResponse & {
  month: number;
  year: number;
  archivedAt: string;
};

export type ArchivedLeaderboardListItem = {
  month: number;
  year: number;
  archivedAt: string;
};

export const fetchLeaderboard = () => request<LeaderboardResponse>("/public/leaderboard");

export const fetchArchivedLeaderboard = (month: number, year: number) =>
  request<ArchivedLeaderboardResponse>(`/public/leaderboard/archived?month=${month}&year=${year}`);

/**
 * Lists archived months. Backed by an admin endpoint, so non-admin callers
 * will receive 401/403; callers should treat errors as "no archives visible".
 */
export async function listArchivedLeaderboards(): Promise<ArchivedLeaderboardListItem[]> {
  const data = await request<{ archives: ArchivedLeaderboardListItem[] }>("/admin/leaderboard/archived");
  return data.archives;
}

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
