import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/ui/alert";
import { resolveSessionFromApi } from "@/lib/require-user-session";
import { USER_SESSION_COOKIE } from "@/lib/user-session";

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
  const session = jar.get(USER_SESSION_COOKIE)?.value
    ? await resolveSessionFromApi()
    : null;
  if (session && (session.role === "admin" || session.role === "super_admin")) {
    redirect(next);
  }

  const errorParam = sp.error ? decodeURIComponent(sp.error) : null;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Welcome back"
        title="Sign in to admin."
        description="Manage categories, users, quotas, and the audit log. The leaderboard stays public for everyone."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-ink-200 bg-card p-8">
          {errorParam ? (
            <div className="mb-5">
              <Alert variant="destructive">{errorParam}</Alert>
            </div>
          ) : null}

          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-400">
            Slack SSO
          </p>
          <p className="mt-2 font-display text-3xl italic text-ink-900">
            One click and you&rsquo;re in.
          </p>
          <p className="mt-2 max-w-[48ch] text-sm text-ink-500">
            We use your Slack identity to map you to a workspace user. Admin permissions
            come from your role claim, which is set by an existing super-admin.
          </p>

          <a
            href={`/auth/slack/login?next=${encodeURIComponent(next)}`}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-ink-900 px-5 text-sm font-medium text-paper transition-colors hover:bg-ink-800"
          >
            Continue with Slack
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <aside className="rounded-3xl border border-ink-200 bg-paper-2/40 p-8">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-400">
            No sign-in needed
          </p>
          <p className="mt-2 font-display text-3xl italic text-ink-900">
            The leaderboard is open.
          </p>
          <p className="mt-2 text-sm text-ink-500">
            Browse top givers and receivers without an admin session.
          </p>
          <Link
            href="/leaderboard"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-900 underline decoration-leaf-500 decoration-2 underline-offset-4 hover:decoration-ink-900"
          >
            Open leaderboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
