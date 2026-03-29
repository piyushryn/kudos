import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { ResetAllBalancesButton } from "@/components/reset-all-balances-button";

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
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const catData = await loadCategoryOptions();
  const categories = "categories" in catData ? catData.categories : undefined;
  const categoryLoadError = "error" in catData ? catData.error : undefined;
  const categoryOptions =
    categories !== undefined && categories.length > 0 ? categories : null;

  return (
    <>
      <PageHeader
        title="Quotas & balances"
        description={
          <>
            Assign categories, reset monthly balances, and bulk-update quotas. Browse everyone in the workspace on{" "}
            <Link href="/admin/users" className="linkInline">
              Users
            </Link>
            .
          </>
        }
      />

      <div className="stack">
        {sp.notice ? <p className="noticeBanner">{decodeURIComponent(sp.notice)}</p> : null}
        {sp.error ? <p className="errorBanner">{decodeURIComponent(sp.error)}</p> : null}
        {categoryLoadError ? <p className="errorBanner">{categoryLoadError}</p> : null}

        <p className="pageDescription" style={{ marginTop: "-0.75rem", marginBottom: "0.25rem" }}>
          Category definitions live under{" "}
          <Link href="/admin/categories" className="linkInline">
            User categories
          </Link>
          . The workspace default when a category has no quota is <code>DEFAULT_MONTHLY_BALANCE</code> (see env on the
          API server).
        </p>

        <section className="card">
          <h2 className="cardTitle">One user</h2>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Slack User ID looks like <code>U09ABCDEF12</code>.
          </p>
          {!categoryOptions && !categoryLoadError ? (
            <p className="muted" style={{ marginBottom: "1rem" }}>
              No categories available. Add them under{" "}
              <Link href="/admin/categories" className="linkInline">
                User categories
              </Link>
              .
            </p>
          ) : null}
          {categoryOptions ? (
            <form action={assignUserCategoryFormAction} className="formGrid">
              <label>
                Slack User ID
                <input name="slackUserId" type="text" required placeholder="U09ABCDEF12" className="input" />
              </label>
              {categorySelect(categoryOptions)}
              <button type="submit" className="button">
                Assign category
              </button>
            </form>
          ) : null}
          <form action={resetUserBalanceFormAction} className="formGrid" style={{ marginTop: "1.25rem" }}>
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
          <h2 className="cardTitle">Bulk assign category</h2>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            One Slack User ID per line (or comma-separated). Only existing users are updated.
          </p>
          {categoryOptions ? (
            <form action={bulkCategoryFormAction} className="stack">
              <label>
                Slack User IDs
                <textarea name="slackUserIds" rows={6} className="textarea" placeholder={"U09AAA\nU09BBB"} required />
              </label>
              {categorySelect(categoryOptions)}
              <button type="submit" className="button">
                Apply category to listed users
              </button>
            </form>
          ) : null}
        </section>

        <section className="card">
          <h2 className="cardTitle">Reset everyone (current month)</h2>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Sets every user’s <strong>remaining</strong> balance for this calendar month to their effective quota (from
            their category). Requires two confirmations.
          </p>
          <ResetAllBalancesButton />
        </section>
      </div>
    </>
  );
}
