import Link from "next/link";

import { ResetAllBalancesButton } from "../../../components/reset-all-balances-button";
import {
  assignUserCategoryFormAction,
  bulkCategoryFormAction,
  resetUserBalanceFormAction,
} from "./actions";

type AdminUserCategory = {
  id: string;
  key: string;
  name: string;
  monthlyGivingQuota: number | null;
};

type AdminUsersResponse = {
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

async function loadAdminUsers(
  search: string,
  page: number,
): Promise<AdminUsersResponse | { error: string }> {
  const base = (process.env.DASHBOARD_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token) {
    return { error: "INTERNAL_API_TOKEN is not set." };
  }
  const qs = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: "40",
  });
  if (search.trim()) {
    qs.set("search", search.trim());
  }
  const res = await fetch(`${base}/admin/users?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return { error: `Failed to load users (${res.status})` };
  }
  return res.json() as Promise<AdminUsersResponse>;
}

type CategoryListResponse = { categories: AdminUserCategory[] } | { error: string };

async function loadCategoryOptions(): Promise<CategoryListResponse> {
  const base = (process.env.DASHBOARD_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token) {
    return { error: "INTERNAL_API_TOKEN is not set." };
  }
  const res = await fetch(`${base}/admin/user-categories`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return { error: `Failed to load categories (${res.status})` };
  }
  const json = (await res.json()) as { categories: Array<AdminUserCategory & { userCount?: number }> };
  return {
    categories: json.categories.map(({ id, key, name, monthlyGivingQuota }) => ({
      id,
      key,
      name,
      monthlyGivingQuota,
    })),
  };
}

function categorySelect(categories: AdminUserCategory[], name = "userCategoryId", required = true) {
  return (
    <label>
      Category
      <select name={name} className="input" required={required} defaultValue="">
        <option value="" disabled>
          Select…
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.key}
            {c.monthlyGivingQuota != null ? ` · ${c.monthlyGivingQuota} pts` : " · workspace default"})
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function AdminQuotasPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string; search?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const search = sp.search ?? "";
  const page = Number(sp.page ?? 1) || 1;
  const [data, catData] = await Promise.all([loadAdminUsers(search, page), loadCategoryOptions()]);
  const categories = "categories" in catData ? catData.categories : undefined;
  const categoryLoadError = "error" in catData ? catData.error : undefined;
  const assignFormsEnabled = Boolean(categories?.length);

  return (
    <div className="stack">
      <h2>Admin · Quotas &amp; balances</h2>
      <p className="muted">
        Workspace default when a category has no quota: <code>DEFAULT_MONTHLY_BALANCE</code> (currently{" "}
        {"error" in data ? "—" : data.defaultMonthlyBalance}). Define categories and quotas on{" "}
        <Link href="/admin/categories">Admin · Categories</Link>. Assign categories here; effective quota updates
        immediately for new balance rows and manual resets.
      </p>

      {sp.notice ? <p className="noticeBanner">{decodeURIComponent(sp.notice)}</p> : null}
      {sp.error ? <p className="errorBanner">{decodeURIComponent(sp.error)}</p> : null}
      {"error" in data ? <p className="errorBanner">{data.error}</p> : null}
      {categoryLoadError ? <p className="errorBanner">{categoryLoadError}</p> : null}

      <section className="card">
        <h2>One user</h2>
        <p className="muted">
          Slack User ID looks like <code>U09ABCDEF12</code>.
        </p>
        {!assignFormsEnabled && !categoryLoadError ? (
          <p className="muted">
            No categories available. Add them on <Link href="/admin/categories">Admin · Categories</Link>.
          </p>
        ) : null}
        {assignFormsEnabled ? (
          <form action={assignUserCategoryFormAction} className="formGrid">
            <label>
              Slack User ID
              <input name="slackUserId" type="text" required placeholder="U09ABCDEF12" className="input" />
            </label>
            {categorySelect(categories)}
            <button type="submit" className="button">
              Assign category
            </button>
          </form>
        ) : null}
        <form action={resetUserBalanceFormAction} className="formGrid" style={{ marginTop: "1rem" }}>
          <label>
            Slack User ID (reset balance)
            <input name="slackUserId" type="text" required placeholder="U09ABCDEF12" className="input" />
          </label>
          <button type="submit" className="button secondaryButton">
            Reset this user’s balance (current month → full quota)
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Bulk assign category</h2>
        <p className="muted">One Slack User ID per line (or comma-separated). Only existing users are updated.</p>
        {assignFormsEnabled ? (
          <form action={bulkCategoryFormAction} className="stack">
            <label>
              Slack User IDs
              <textarea name="slackUserIds" rows={6} className="textarea" placeholder={"U09AAA\nU09BBB"} required />
            </label>
            {categorySelect(categories)}
            <button type="submit" className="button">
              Apply category to listed users
            </button>
          </form>
        ) : null}
      </section>

      <section className="card">
        <h2>Reset everyone (current month)</h2>
        <p className="muted">
          Sets every user’s <strong>remaining</strong> balance for this calendar month to their effective quota (from
          their category). Requires two confirmations.
        </p>
        <ResetAllBalancesButton />
      </section>

      {"error" in data ? null : (
        <section className="stack">
          <h2>Users ({data.total})</h2>
          <form method="get" className="row">
            <input
              name="search"
              type="search"
              placeholder="Search name or Slack ID"
              defaultValue={search}
              className="input"
              style={{ flex: 1, maxWidth: "320px" }}
            />
            <input type="hidden" name="page" value="1" />
            <button type="submit" className="button secondaryButton">
              Search
            </button>
          </form>
          <div className="tableWrapper">
            <table className="table">
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
                href={`/admin/quotas?search=${encodeURIComponent(search)}&page=${data.page - 1}`}
                className="button secondaryButton"
              >
                Previous
              </Link>
            ) : null}
            {data.page * data.pageSize < data.total ? (
              <Link
                href={`/admin/quotas?search=${encodeURIComponent(search)}&page=${data.page + 1}`}
                className="button secondaryButton"
              >
                Next
              </Link>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
