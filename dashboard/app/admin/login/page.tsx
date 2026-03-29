import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import {
  ADMIN_SESSION_COOKIE,
  isDashboardAuthConfigured,
  verifySessionToken,
} from "@/lib/admin-session";

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
  const secret = process.env.DASHBOARD_AUTH_SECRET ?? "";
  const jar = await cookies();
  if (secret && verifySessionToken(jar.get(ADMIN_SESSION_COOKIE)?.value, secret)) {
    redirect(next);
  }

  const configured = isDashboardAuthConfigured();
  const errorParam = sp.error ? decodeURIComponent(sp.error) : null;

  return (
    <>
      <PageHeader
        title="Admin sign in"
        description="Sign in to manage categories, users, quotas, and the audit log. The leaderboard stays public."
      />

      <div className="stack" style={{ maxWidth: "420px" }}>
        {errorParam ? <p className="errorBanner">{errorParam}</p> : null}

        {!configured ? (
          <p className="errorBanner">
            Set <code>DASHBOARD_ADMIN_USERNAME</code>, <code>DASHBOARD_ADMIN_PASSWORD</code>, and{" "}
            <code>DASHBOARD_AUTH_SECRET</code> (at least 16 characters) in the dashboard environment. See{" "}
            <code>.env.example</code>.
          </p>
        ) : (
          <form action={loginAction} className="card formGrid">
            <input type="hidden" name="next" value={next} />
            <label>
              Username
              <input name="username" type="text" autoComplete="username" required className="input" />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete="current-password" required className="input" />
            </label>
            <button type="submit" className="button">
              Sign in
            </button>
          </form>
        )}

        <p className="muted" style={{ fontSize: "0.9rem" }}>
          <Link href="/leaderboard" className="linkInline">
            Open leaderboard
          </Link>{" "}
          without signing in.
        </p>
      </div>
    </>
  );
}
