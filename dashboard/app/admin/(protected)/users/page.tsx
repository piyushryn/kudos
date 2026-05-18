import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadAdminUsers } from "@/lib/admin-users";
import { requireAdminSession } from "@/lib/require-admin-session";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requireAdminSession("/admin/users");
  const sp = await searchParams;
  const search = sp.search ?? "";
  const page = Number(sp.page ?? 1) || 1;
  const data = await loadAdminUsers(search, page);

  return (
    <>
      <PageHeader
        title="Users"
        description={
          <>
            Everyone who has used kudos in this workspace. User-private stats are self-view only. Assign categories and
            reset balances on{" "}
            <Link href="/admin/quotas" className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800">
              Quotas & balances
            </Link>
            {session.role === "super_admin" ? (
              <>
                {" "}
                and manage admin access on{" "}
                <Link
                  href="/admin/rbac-users"
                  className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
                >
                  Access control
                </Link>
                .
              </>
            ) : (
              "."
            )}
          </>
        }
      />

      <div className="space-y-4">
        {"error" in data ? <Alert variant="destructive">{data.error}</Alert> : null}

        {"error" in data ? null : (
          <>
            <form method="get" className="flex w-full max-w-[600px] flex-wrap items-center gap-3">
              <Input
                name="search"
                type="search"
                placeholder="Search name or Slack ID"
                defaultValue={search}
                className="min-w-60 flex-1"
              />
              <input type="hidden" name="page" value="1" />
              <Button type="submit" variant="secondary">Search</Button>
            </form>

            <p className="text-sm text-slate-500">
              <strong className="font-semibold text-slate-900">{data.total}</strong> user
              {data.total === 1 ? "" : "s"}
              {search.trim() ? (
                <>
                  {" "}
                  matching <code>{search.trim()}</code>
                </>
              ) : null}
              . Workspace default quota: <strong>{data.defaultMonthlyBalance}</strong>.
            </p>

            <Card className="overflow-x-auto">
              <Table className="min-w-[920px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slack ID</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Cat. quota</TableHead>
                    <TableHead>Effective quota</TableHead>
                    <TableHead>Remaining (month)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.displayName}</TableCell>
                      <TableCell><code>{u.slackUserId}</code></TableCell>
                      <TableCell>
                        {u.userCategory.name} <span className="text-slate-500">({u.userCategory.key})</span>
                      </TableCell>
                      <TableCell>{u.userCategory.monthlyGivingQuota ?? "—"}</TableCell>
                      <TableCell>{u.effectiveMonthlyQuota}</TableCell>
                      <TableCell>{u.remainingBalanceThisMonth}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              Page {data.page} of {Math.max(1, Math.ceil(data.total / data.pageSize))}
              {data.page > 1 ? (
                <Button asChild variant="secondary">
                  <Link href={`/admin/users?search=${encodeURIComponent(search)}&page=${data.page - 1}`}>Previous</Link>
                </Button>
              ) : null}
              {data.page * data.pageSize < data.total ? (
                <Button asChild variant="secondary">
                  <Link href={`/admin/users?search=${encodeURIComponent(search)}&page=${data.page + 1}`}>Next</Link>
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </>
  );
}
