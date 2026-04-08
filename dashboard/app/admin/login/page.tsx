import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-session";

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
  if (verifyAdminSessionToken(jar.get(ADMIN_SESSION_COOKIE)?.value)) {
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
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Slack SSO</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/auth/slack/login?next=${encodeURIComponent(next)}`}>Continue with Slack</Link>
            </Button>
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
