import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { ResetAllBalancesButton } from "@/components/reset-all-balances-button";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkUserIdChipInput, type UserOption, UserIdInput } from "@/components/user-id-picker";
import { getBackendCookieHeaders } from "@/lib/backend-auth";
import { requireAdminSession } from "@/lib/require-admin-session";
import { runtimeEnv } from "@/lib/runtime-env";

import { assignUserCategoryFormAction, bulkCategoryFormAction, resetUserBalanceFormAction } from "./actions";

type AdminUserCategory = {
  id: string;
  key: string;
  name: string;
  monthlyGivingQuota: number | null;
};

type CategoryListResponse = { categories: AdminUserCategory[] } | { error: string };
type UserListResponse = { users: UserOption[] } | { error: string };

async function loadCategoryOptions(): Promise<CategoryListResponse> {
  const base = (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");
  const res = await fetch(`${base}/admin/user-categories`, {
    headers: await getBackendCookieHeaders(),
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

async function loadUserOptions(): Promise<UserListResponse> {
  const base = (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");

  const users: UserOption[] = [];
  let page = 1;
  let total = 0;
  const maxToLoad = 1000;

  while (users.length < maxToLoad && (page === 1 || users.length < total)) {
    const qs = new URLSearchParams({
      page: String(page),
      limit: "100",
    });

    const res = await fetch(`${base}/admin/users?${qs}`, {
      headers: await getBackendCookieHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      return { error: `Failed to load users (${res.status})` };
    }

    const json = (await res.json()) as {
      users: Array<{ slackUserId: string; displayName: string }>;
      total: number;
    };

    total = json.total;
    users.push(
      ...json.users.map((user) => ({
        slackUserId: user.slackUserId,
        displayName: user.displayName,
      })),
    );

    page += 1;
  }

  const deduped = [...new Map(users.map((user) => [user.slackUserId, user])).values()];
  return { users: deduped };
}

function CategorySelect({
  categories,
  name = "userCategoryId",
  required = true,
}: {
  categories: AdminUserCategory[];
  name?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      Category
      <select
        name={name}
        required={required}
        defaultValue=""
        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
      >
        <option value="" disabled>
          Select...
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
  await requireAdminSession("/admin/quotas");
  const sp = await searchParams;
  const catData = await loadCategoryOptions();
  const userData = await loadUserOptions();
  const categories = "categories" in catData ? catData.categories : undefined;
  const users = "users" in userData ? userData.users : [];
  const categoryLoadError = "error" in catData ? catData.error : undefined;
  const userLoadError = "error" in userData ? userData.error : undefined;
  const categoryOptions = categories !== undefined && categories.length > 0 ? categories : null;

  return (
    <>
      <PageHeader
        title="Quotas & balances"
        description={
          <>
            Assign categories, reset monthly balances, and bulk-update quotas. Browse everyone in the workspace on{" "}
            <Link href="/admin/users" className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800">
              Users
            </Link>
            .
          </>
        }
      />

      <div className="space-y-4">
        {sp.notice ? <Alert>{decodeURIComponent(sp.notice)}</Alert> : null}
        {sp.error ? <Alert variant="destructive">{decodeURIComponent(sp.error)}</Alert> : null}
        {categoryLoadError ? <Alert variant="destructive">{categoryLoadError}</Alert> : null}
        {userLoadError ? <Alert variant="destructive">{userLoadError}</Alert> : null}

        <p className="text-sm text-slate-500">
          Category definitions live under{" "}
          <Link href="/admin/categories" className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800">
            User categories
          </Link>
          . The workspace default when a category has no quota is <code>DEFAULT_MONTHLY_BALANCE</code> (see env on the
          API server).
        </p>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">One user</CardTitle>
                <p className="text-sm text-slate-500">
                  Slack User ID looks like <code>U09ABCDEF12</code>.
                </p>
                {!categoryOptions && !categoryLoadError ? (
                  <p className="text-sm text-slate-500">
                    No categories available. Add them under{" "}
                    <Link
                      href="/admin/categories"
                      className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
                    >
                      User categories
                    </Link>
                    .
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-5">
                {categoryOptions ? (
                  <form action={assignUserCategoryFormAction} className="space-y-4">
                    <UserIdInput
                      name="slackUserId"
                      label="Slack User ID"
                      required
                      placeholder="Search by name or Slack ID"
                      users={users}
                    />
                    <CategorySelect categories={categoryOptions} />
                    <Button type="submit">Assign category</Button>
                  </form>
                ) : null}
                <form action={resetUserBalanceFormAction} className="space-y-4">
                  <UserIdInput
                    name="slackUserId"
                    label="Slack User ID (reset balance)"
                    required
                    placeholder="Search by name or Slack ID"
                    users={users}
                  />
                  <Button type="submit" variant="secondary">
                    Reset this user’s balance (current month → full quota)
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Bulk assign category</CardTitle>
                <p className="text-sm text-slate-500">
                  One Slack User ID per line (or comma-separated). Only existing users are updated.
                </p>
              </CardHeader>
              <CardContent>
                {categoryOptions ? (
                  <form action={bulkCategoryFormAction} className="space-y-4">
                    <BulkUserIdChipInput name="slackUserIds" label="Slack User IDs" users={users} required />
                    <CategorySelect categories={categoryOptions} />
                    <Button type="submit">Apply category to listed users</Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <section className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
                  Reset everyone (current month)
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Sets every user’s <strong>remaining</strong> balance for this calendar month to their effective quota
                  (from their category). Requires two confirmations.
                </p>
              </CardHeader>
              <CardContent>
                <ResetAllBalancesButton />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
