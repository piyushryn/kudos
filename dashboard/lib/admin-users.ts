import { getBackendCookieHeaders } from "@/lib/backend-auth";
import { runtimeEnv } from "@/lib/runtime-env";
import { requireAdminSession } from "@/lib/require-admin-session";

export type AdminUserCategory = {
  id: string;
  key: string;
  name: string;
  monthlyGivingQuota: number | null;
};

export type AdminUsersResponse = {
  users: Array<{
    id: string;
    slackUserId: string;
    displayName: string;
    userCategory: AdminUserCategory;
    effectiveMonthlyQuota: number;
    remainingBalanceThisMonth: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
  defaultMonthlyBalance: number;
};

export async function loadAdminUsers(
  search: string,
  page: number,
): Promise<AdminUsersResponse | { error: string }> {
  const base = (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");
  await requireAdminSession("/admin/users");
  const qs = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: "40",
  });
  if (search.trim()) {
    qs.set("search", search.trim());
  }
  const res = await fetch(`${base}/admin/users?${qs}`, {
    headers: await getBackendCookieHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    return { error: `Failed to load users (${res.status})` };
  }
  return res.json() as Promise<AdminUsersResponse>;
}
