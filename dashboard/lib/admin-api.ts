import { getBackendCookieHeaders } from "@/lib/backend-auth";
import { runtimeEnv } from "@/lib/runtime-env";
import { requireAdminSession } from "@/lib/require-admin-session";

// For admin APIs (server-side), always get the base URL from env
const apiBaseUrl = (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");

export type AdminLeaderboardResponse = {
  topGivers: Array<{ userId: string; displayName: string; points: number }>;
  topReceivers: Array<{ userId: string; displayName: string; points: number }>;
};

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

async function requestAdmin<T>(path: string, headers?: HeadersInit): Promise<T> {
  const cookieHeaders = await getBackendCookieHeaders();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...cookieHeaders,
      ...(headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const fetchAdminLeaderboard = async () => {
  await requireAdminSession("/admin/leaderboard-reset");
  return requestAdmin<AdminLeaderboardResponse>("/admin/leaderboard");
};

export const fetchAuditLog = async (params: AuditLogQueryParams = {}): Promise<AuditLogResponse> => {
  await requireAdminSession("/admin/audit-log");
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.showArchived) searchParams.set("showArchived", "true");
  if (params.month !== undefined) searchParams.set("month", String(params.month));
  if (params.year !== undefined) searchParams.set("year", String(params.year));
  const qs = searchParams.toString();
  return requestAdmin<AuditLogResponse>(`/admin/audit-log${qs ? `?${qs}` : ""}`);
};
