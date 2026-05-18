import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

async function loadCategories(token: string): Promise<{ categories: CategoryRow[] } | { error: string }> {
  const base = (runtimeEnv("DASHBOARD_API_BASE_URL") ?? "http://localhost:4000").replace(/\/$/, "");
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
  const session = await requireAdminSession("/admin/categories");
  const sp = await searchParams;
  const data = await loadCategories(session.token);

  return (
    <>
      <PageHeader
        title="User categories"
        description={
          <>
            Shared settings such as monthly giving quota. Leave quota empty to use workspace <code>DEFAULT_MONTHLY_BALANCE</code>.
            New Slack users get the <strong>employee</strong> category. Browse users on{" "}
            <Link href="/admin/users" className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800">
              Users
            </Link>
            ; assign categories on{" "}
            <Link href="/admin/quotas" className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800">
              Quotas & balances
            </Link>
            .
          </>
        }
      />

      <div className="space-y-4">
        {sp.notice ? <Alert>{decodeURIComponent(sp.notice)}</Alert> : null}
        {sp.error ? <Alert variant="destructive">{decodeURIComponent(sp.error)}</Alert> : null}
        {"error" in data ? <Alert variant="destructive">{data.error}</Alert> : null}

        <section>
          <Card className="w-full max-w-[600px]">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500">New category</CardTitle>
              <p className="text-sm text-slate-500">
            Key: lowercase identifier (e.g. <code>manager</code>). Cannot be changed later.
              </p>
            </CardHeader>
            <CardContent>
              <form action={createCategoryAction} className="space-y-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Key
                  <Input
                name="key"
                type="text"
                required
                placeholder="manager"
                pattern="[a-z][a-z0-9_]{1,62}"
              />
            </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Display name
                  <Input name="name" type="text" required placeholder="Manager" />
            </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Monthly quota (optional)
                  <Input name="quota" type="number" min={1} placeholder="Workspace default if empty" />
            </label>
                <Button type="submit">
              Create category
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {"categories" in data ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Existing categories</h2>
            <Card className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Name &amp; quota</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <code>{c.key}</code>
                      </TableCell>
                      <TableCell>
                        <form action={updateCategoryAction} className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
                          <input type="hidden" name="categoryId" value={c.id} />
                          <Input
                            name="name"
                            type="text"
                            defaultValue={c.name}
                            required
                            className="max-w-64 flex-1"
                          />
                          <Input
                            name="quota"
                            type="number"
                            min={1}
                            placeholder="Default"
                            defaultValue={c.monthlyGivingQuota ?? ""}
                            className="w-24"
                          />
                          <Button type="submit" variant="secondary">Save</Button>
                        </form>
                      </TableCell>
                      <TableCell>{c.userCount}</TableCell>
                      <TableCell>
                        {c.key !== "employee" ? (
                          <DeleteCategoryButton categoryId={c.id} />
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>
        ) : null}
      </div>
    </>
  );
}
