import Link from "next/link";

import { Monogram } from "@/components/monogram";
import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · users"
        title="Everyone in the room."
        description={
          <>
            Everyone who has used kudos in this workspace. User-private stats are
            self-view only. Assign categories and reset balances on{" "}
            <Link href="/admin/quotas" className="font-medium text-ink-900 underline decoration-leaf-500 decoration-2 underline-offset-4 hover:decoration-ink-900">
              Quotas & balances
            </Link>
            {session.role === "super_admin" ? (
              <>
                {" "}
                and manage admin access on{" "}
                <Link
                  href="/admin/rbac-users"
                  className="font-medium text-ink-900 underline decoration-leaf-500 decoration-2 underline-offset-4 hover:decoration-ink-900"
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

      {"error" in data ? <Alert variant="destructive">{data.error}</Alert> : null}

      {"error" in data ? null : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <form
              method="get"
              className="flex w-full max-w-[480px] flex-wrap items-center gap-2"
            >
              <Input
                name="search"
                type="search"
                placeholder="Search name or Slack ID"
                defaultValue={search}
                className="min-w-60 flex-1"
              />
              <input type="hidden" name="page" value="1" />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>

            <p className="text-sm text-ink-500">
              <strong className="font-semibold text-ink-900">{data.total}</strong>{" "}
              user
              {data.total === 1 ? "" : "s"}
              {search.trim() ? (
                <>
                  {" "}
                  matching <code>{search.trim()}</code>
                </>
              ) : null}
              <span className="px-1.5 text-ink-300">·</span>
              Workspace default quota{" "}
              <strong className="text-ink-900">{data.defaultMonthlyBalance}</strong>
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-card">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-paper-2/40">
                    {[
                      "Name",
                      "Slack ID",
                      "Category",
                      "Cat. quota",
                      "Effective",
                      "Remaining",
                    ].map((h) => (
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
                  {data.users.map((u) => {
                    const ratio =
                      u.effectiveMonthlyQuota > 0
                        ? u.remainingBalanceThisMonth / u.effectiveMonthlyQuota
                        : 0;
                    const barColor =
                      ratio === 0 || ratio < 0.25
                        ? "bg-coral-500"
                        : ratio < 0.5
                          ? "bg-coral-200"
                          : "bg-leaf-500";
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-ink-200 last:border-b-0 transition-colors hover:bg-paper-2/60"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Monogram name={u.displayName} size="sm" />
                            <span className="text-sm font-medium text-ink-900">
                              {u.displayName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code>{u.slackUserId}</code>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-ink-900">
                            {u.userCategory.name}
                          </span>{" "}
                          <span className="text-xs text-ink-400">
                            ({u.userCategory.key})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-700 tabular-nums">
                          {u.userCategory.monthlyGivingQuota ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-900 tabular-nums">
                          {u.effectiveMonthlyQuota}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="w-10 font-display text-lg italic tabular-nums text-ink-900">
                              {u.remainingBalanceThisMonth}
                            </span>
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
                              <div
                                className={cn("h-full", barColor)}
                                style={{
                                  width: `${Math.max(2, Math.min(100, ratio * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-500">
            <span>
              Page {data.page} of {Math.max(1, Math.ceil(data.total / data.pageSize))}
            </span>
            {data.page > 1 ? (
              <Button asChild variant="secondary">
                <Link
                  href={`/admin/users?search=${encodeURIComponent(search)}&page=${data.page - 1}`}
                >
                  Previous
                </Link>
              </Button>
            ) : null}
            {data.page * data.pageSize < data.total ? (
              <Button asChild variant="secondary">
                <Link
                  href={`/admin/users?search=${encodeURIComponent(search)}&page=${data.page + 1}`}
                >
                  Next
                </Link>
              </Button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
