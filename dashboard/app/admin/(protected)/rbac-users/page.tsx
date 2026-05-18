import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const dashboardApiBase = () => (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");

async function loadRoleManagedUsers(token: string): Promise<RoleManagedUsersResponse | { error: string }> {
  const res = await fetch(`${dashboardApiBase()}/admin/rbac/users?page=1&limit=200`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return { error: `Failed to load role-managed users (${res.status})` };
  }
  return (await res.json()) as RoleManagedUsersResponse;
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
  const data = await loadRoleManagedUsers(session.token);

  return (
    <>
      <PageHeader
        title="Access control"
        description="Super-admin only. Promote or demote workspace users between user and admin."
      />

      <div className="space-y-4">
        {sp.notice ? <Alert>{decodeURIComponent(sp.notice)}</Alert> : null}
        {sp.error ? <Alert variant="destructive">{decodeURIComponent(sp.error)}</Alert> : null}
        {"error" in data ? <Alert variant="destructive">{data.error}</Alert> : null}

        {"error" in data ? null : (
          <Card className="overflow-x-auto">
            <Table className="min-w-[880px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slack ID</TableHead>
                  <TableHead>Current role</TableHead>
                  <TableHead>Admin flag</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user) => (
                  <TableRow key={user.slackUserId}>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>
                      <code>{user.slackUserId}</code>
                    </TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.isAdmin ? "true" : "false"}</TableCell>
                    <TableCell>
                      {user.isSuperAdmin ? (
                        <span className="text-xs text-slate-500">Env-controlled super admin</span>
                      ) : user.role === "admin" ? (
                        <form action={patchUserRoleAction}>
                          <input type="hidden" name="slackUserId" value={user.slackUserId} />
                          <input type="hidden" name="role" value="user" />
                          <Button type="submit" variant="secondary">
                            Demote to user
                          </Button>
                        </form>
                      ) : (
                        <form action={patchUserRoleAction}>
                          <input type="hidden" name="slackUserId" value={user.slackUserId} />
                          <input type="hidden" name="role" value="admin" />
                          <Button type="submit">Promote to admin</Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}
