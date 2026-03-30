import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { loadAdminUsers } from "@/lib/admin-users";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
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
            Everyone who has used kudos in this workspace. Open a row to see full stats. Assign categories and reset
            balances on{" "}
            <Link href="/admin/quotas" className="linkInline">
              Quotas & balances
            </Link>
            .
          </>
        }
      />

      <div className="stack">
        {"error" in data ? <p className="errorBanner">{data.error}</p> : null}

        {"error" in data ? null : (
          <>
            <form method="get" className="row formRowBar">
              <input
                name="search"
                type="search"
                placeholder="Search name or Slack ID"
                defaultValue={search}
                className="input"
              />
              <input type="hidden" name="page" value="1" />
              <button type="submit" className="button secondaryButton">
                Search
              </button>
            </form>

            <p className="muted" style={{ marginTop: "-0.25rem" }}>
              <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{data.total}</strong> user
              {data.total === 1 ? "" : "s"}
              {search.trim() ? (
                <>
                  {" "}
                  matching <code>{search.trim()}</code>
                </>
              ) : null}
              . Workspace default quota: <strong>{data.defaultMonthlyBalance}</strong>.
            </p>

            <div className="tableWrapper">
              <table className="table" style={{ minWidth: "920px" }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slack ID</th>
                    <th>Category</th>
                    <th>Cat. quota</th>
                    <th>Effective quota</th>
                    <th>Remaining (month)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.displayName}</td>
                      <td>
                        <Link href={`/users/${encodeURIComponent(u.slackUserId)}`}>{u.slackUserId}</Link>
                      </td>
                      <td>
                        {u.userCategory.name} <span className="muted">({u.userCategory.key})</span>
                      </td>
                      <td>{u.userCategory.monthlyGivingQuota ?? "—"}</td>
                      <td>{u.effectiveMonthlyQuota}</td>
                      <td>{u.remainingBalanceThisMonth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row muted">
              Page {data.page} of {Math.max(1, Math.ceil(data.total / data.pageSize))}
              {data.page > 1 ? (
                <Link
                  href={`/admin/users?search=${encodeURIComponent(search)}&page=${data.page - 1}`}
                  className="button secondaryButton"
                >
                  Previous
                </Link>
              ) : null}
              {data.page * data.pageSize < data.total ? (
                <Link
                  href={`/admin/users?search=${encodeURIComponent(search)}&page=${data.page + 1}`}
                  className="button secondaryButton"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </>
        )}
      </div>
    </>
  );
}
