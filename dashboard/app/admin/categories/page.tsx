import Link from "next/link";

import { DeleteCategoryButton } from "./delete-category-button";
import { createCategoryAction, updateCategoryAction } from "./actions";

type CategoryRow = {
  id: string;
  key: string;
  name: string;
  monthlyGivingQuota: number | null;
  userCount: number;
};

async function loadCategories(): Promise<{ categories: CategoryRow[] } | { error: string }> {
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
  return res.json() as Promise<{ categories: CategoryRow[] }>;
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const data = await loadCategories();

  return (
    <div className="stack">
      <h2>Admin · User categories</h2>
      <p className="muted">
        Categories define shared settings such as monthly giving quota. Leave quota empty to use the workspace{" "}
        <code>DEFAULT_MONTHLY_BALANCE</code>. New Slack users are assigned the <strong>employee</strong> category
        automatically. Manage who is in which category on{" "}
        <Link href="/admin/quotas">Admin · Quotas</Link>.
      </p>

      {sp.notice ? <p className="noticeBanner">{decodeURIComponent(sp.notice)}</p> : null}
      {sp.error ? <p className="errorBanner">{decodeURIComponent(sp.error)}</p> : null}
      {"error" in data ? <p className="errorBanner">{data.error}</p> : null}

      <section className="card">
        <h3>New category</h3>
        <p className="muted">
          Key: lowercase identifier (e.g. <code>manager</code>). Cannot be changed later.
        </p>
        <form action={createCategoryAction} className="formGrid">
          <label>
            Key
            <input name="key" type="text" required placeholder="manager" className="input" pattern="[a-z][a-z0-9_]{1,62}" />
          </label>
          <label>
            Display name
            <input name="name" type="text" required placeholder="Manager" className="input" />
          </label>
          <label>
            Monthly quota (optional)
            <input name="quota" type="number" min={1} placeholder="Workspace default if empty" className="input" />
          </label>
          <button type="submit" className="button">
            Create category
          </button>
        </form>
      </section>

      {"categories" in data ? (
        <section className="stack">
          <h3>Existing categories</h3>
          <div className="tableWrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Name &amp; quota</th>
                  <th>Users</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <code>{c.key}</code>
                    </td>
                    <td>
                      <form action={updateCategoryAction} className="row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
                        <input type="hidden" name="categoryId" value={c.id} />
                        <input name="name" type="text" defaultValue={c.name} required className="input" style={{ minWidth: "140px" }} />
                        <input
                          name="quota"
                          type="number"
                          min={1}
                          placeholder="Default"
                          defaultValue={c.monthlyGivingQuota ?? ""}
                          className="input"
                          style={{ width: "120px" }}
                        />
                        <button type="submit" className="button secondaryButton">
                          Save
                        </button>
                      </form>
                    </td>
                    <td>{c.userCount}</td>
                    <td>
                      {c.key !== "employee" ? <DeleteCategoryButton categoryId={c.id} /> : <span className="muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
