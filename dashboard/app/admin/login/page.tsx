import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

import { loginAction } from "./actions";

function sanitizeNext(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("//")) {
    return "/admin";
  }
  return raw;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sanitizeNext(sp.next);
  const jar = await cookies();
  if (verifySessionToken(jar.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect(next);
  }

  const errorParam = sp.error ? decodeURIComponent(sp.error) : null;

  return (
    <>
      <PageHeader
        title="Admin sign in"
        description="Sign in to manage categories, users, quotas, and the audit log. The leaderboard stays public."
      />

      <div className="w-full max-w-[600px] space-y-4">
        {errorParam ? <Alert variant="destructive">{errorParam}</Alert> : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={loginAction} className="space-y-4">
              <input type="hidden" name="next" value={next} />
              <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-slate-700">
                Password
                <Input name="password" type="password" autoComplete="current-password" required />
              </label>
              <Button type="submit">Sign in</Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-sm text-slate-500">
          <Link href="/leaderboard" className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800">
            Open leaderboard
          </Link>{" "}
          without signing in.
        </p>
      </div>
    </>
  );
}
