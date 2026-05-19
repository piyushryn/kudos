import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBackendCookieHeaders } from "@/lib/backend-auth";
import { requireAdminSession } from "@/lib/require-admin-session";
import { runtimeEnv } from "@/lib/runtime-env";

import { createCategoryAction, updateCategoryAction } from "./actions";
import { DeleteCategoryButton } from "./delete-category-button";

type CategoryRow = {
  id: string;
  key: string;
  name: string;
  monthlyGivingQuota: number | null;
  userCount: number;
};

async function loadCategories(): Promise<
  { categories: CategoryRow[] } | { error: string }
> {
  const base = (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(
    /\/$/,
    "",
  );
  const res = await fetch(`${base}/admin/user-categories`, {
    headers: await getBackendCookieHeaders(),
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
  await requireAdminSession("/admin/categories");
  const sp = await searchParams;
  const data = await loadCategories();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · categories"
        title="Set the lanes."
        description={
          <>
            Shared settings such as monthly giving quota. Leave quota empty to use
            workspace <code>DEFAULT_MONTHLY_BALANCE</code>. New Slack users get the{" "}
            <strong>employee</strong> category. Browse users on{" "}
            <Link
              href="/admin/users"
              className="font-medium text-ink-900 underline decoration-leaf-500 decoration-2 underline-offset-4 hover:decoration-ink-900"
            >
              Users
            </Link>
            ; assign categories on{" "}
            <Link
              href="/admin/quotas"
              className="font-medium text-ink-900 underline decoration-leaf-500 decoration-2 underline-offset-4 hover:decoration-ink-900"
            >
              Quotas & balances
            </Link>
            .
          </>
        }
      />

      {sp.notice ? <Alert>{decodeURIComponent(sp.notice)}</Alert> : null}
      {sp.error ? <Alert variant="destructive">{decodeURIComponent(sp.error)}</Alert> : null}
      {"error" in data ? <Alert variant="destructive">{data.error}</Alert> : null}

      <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-ink-200 bg-card p-6 lg:self-start">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-400">
            New category
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Key: lowercase identifier (e.g. <code>manager</code>). Cannot be changed later.
          </p>
          <form action={createCategoryAction} className="mt-5 space-y-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
              Key
              <Input
                name="key"
                type="text"
                required
                placeholder="manager"
                pattern="[a-z][a-z0-9_]{1,62}"
                className="font-mono"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
              Display name
              <Input name="name" type="text" required placeholder="Manager" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
              Monthly quota{" "}
              <span className="font-normal text-ink-400">(optional)</span>
              <Input
                name="quota"
                type="number"
                min={1}
                placeholder="Workspace default if empty"
              />
            </label>
            <Button type="submit">Create category</Button>
          </form>
        </div>

        {"categories" in data ? (
          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-card">
            <div className="border-b border-ink-200 px-5 py-3">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-400">
                Existing categories
              </p>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-paper-2/40">
                    {["Key", "Name & quota", "Users", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.categories.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-ink-200 last:border-b-0"
                    >
                      <td className="px-4 py-3 align-middle">
                        <code>{c.key}</code>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <form
                          action={updateCategoryAction}
                          className="flex min-w-0 max-w-full flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="categoryId" value={c.id} />
                          <Input
                            name="name"
                            type="text"
                            defaultValue={c.name}
                            required
                            className="h-9 max-w-56 flex-1"
                          />
                          <Input
                            name="quota"
                            type="number"
                            min={1}
                            placeholder="Default"
                            defaultValue={c.monthlyGivingQuota ?? ""}
                            className="h-9 w-24"
                          />
                          <Button
                            type="submit"
                            variant="secondary"
                            size="sm"
                          >
                            Save
                          </Button>
                        </form>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="font-display text-xl italic tabular-nums text-ink-900">
                          {c.userCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {c.key !== "employee" ? (
                          <DeleteCategoryButton categoryId={c.id} />
                        ) : (
                          <span className="text-xs text-ink-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
