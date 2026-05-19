import { redirect } from "next/navigation";

import { Monogram } from "@/components/monogram";
import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBackendCookieHeaders } from "@/lib/backend-auth";
import { requireAdminSession } from "@/lib/require-admin-session";
import { runtimeEnv } from "@/lib/runtime-env";

import { patchUserRoleAction } from "./actions";

type RoleManagedUsersResponse = {
  users: Array<{
    slackUserId: string;
    displayName: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    role: "user" | "admin" | "super_admin";
  }>;
  total: number;
  page: number;
  pageSize: number;
};

const dashboardApiBase = () =>
  (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");

async function loadRoleManagedUsers(): Promise<
  RoleManagedUsersResponse | { error: string }
> {
  const res = await fetch(`${dashboardApiBase()}/admin/rbac/users?page=1&limit=200`, {
    headers: await getBackendCookieHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    return { error: `Failed to load role-managed users (${res.status})` };
  }
  return (await res.json()) as RoleManagedUsersResponse;
}

function RolePill({
  role,
}: {
  role: "user" | "admin" | "super_admin";
}) {
  if (role === "super_admin") return <Badge variant="violet">super admin</Badge>;
  if (role === "admin") return <Badge variant="secondary">admin</Badge>;
  return <Badge variant="default">user</Badge>;
}

export default async function AdminRbacUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const session = await requireAdminSession("/admin/rbac-users");
  if (session.role !== "super_admin") {
    redirect("/admin");
  }

  const sp = await searchParams;
  const data = await loadRoleManagedUsers();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · access control"
        title="Hand out the keys."
        description="Super-admin only. Promote or demote workspace users between user and admin."
      />

      {sp.notice ? <Alert>{decodeURIComponent(sp.notice)}</Alert> : null}
      {sp.error ? <Alert variant="destructive">{decodeURIComponent(sp.error)}</Alert> : null}
      {"error" in data ? <Alert variant="destructive">{data.error}</Alert> : null}

      {"error" in data ? null : (
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-card">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-paper-2/40">
                  {["Name", "Slack ID", "Role", "Admin flag", "Action"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr
                    key={user.slackUserId}
                    className="border-b border-ink-200 last:border-b-0 transition-colors hover:bg-paper-2/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Monogram name={user.displayName} size="sm" />
                        <span className="text-sm text-ink-900">
                          {user.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code>{user.slackUserId}</code>
                    </td>
                    <td className="px-4 py-3">
                      <RolePill role={user.role} />
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-600">
                      {user.isAdmin ? "true" : "false"}
                    </td>
                    <td className="px-4 py-3">
                      {user.isSuperAdmin ? (
                        <span className="text-xs text-ink-400">
                          Env-controlled super admin
                        </span>
                      ) : user.role === "admin" ? (
                        <form action={patchUserRoleAction}>
                          <input
                            type="hidden"
                            name="slackUserId"
                            value={user.slackUserId}
                          />
                          <input type="hidden" name="role" value="user" />
                          <Button type="submit" variant="secondary" size="sm">
                            Demote to user
                          </Button>
                        </form>
                      ) : (
                        <form action={patchUserRoleAction}>
                          <input
                            type="hidden"
                            name="slackUserId"
                            value={user.slackUserId}
                          />
                          <input type="hidden" name="role" value="admin" />
                          <Button type="submit" size="sm">
                            Promote to admin
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
