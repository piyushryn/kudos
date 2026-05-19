import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { requireAdminSession } from "@/lib/require-admin-session";
import { cn } from "@/lib/utils";

type Accent = "leaf" | "coral" | "violet" | "ink";

const ACCENT_BAR: Record<Accent, string> = {
  leaf: "bg-leaf-500",
  coral: "bg-coral-500",
  violet: "bg-violet-500",
  ink: "bg-ink-900",
};

type Section = {
  href: string;
  title: string;
  desc: string;
  accent: Accent;
  superAdminOnly?: boolean;
};

const SECTIONS: Section[] = [
  {
    href: "/admin/audit-log",
    title: "Audit log",
    desc: "Every transfer, every reset — append-only history.",
    accent: "leaf",
  },
  {
    href: "/admin/users",
    title: "Users",
    desc: "Browse everyone using kudos in this workspace.",
    accent: "ink",
  },
  {
    href: "/admin/categories",
    title: "Categories",
    desc: "Roles, names, and monthly giving quotas.",
    accent: "violet",
  },
  {
    href: "/admin/quotas",
    title: "Quotas & balances",
    desc: "Assign categories. Reset monthly balances.",
    accent: "leaf",
  },
  {
    href: "/admin/leaderboard-reset",
    title: "Leaderboard reset",
    desc: "Clear all-time totals without deleting history.",
    accent: "coral",
  },
  {
    href: "/admin/rbac-users",
    title: "Access control",
    desc: "Promote or demote admins. Super-admin only.",
    accent: "ink",
    superAdminOnly: true,
  },
];

export default async function AdminHomePage() {
  const session = await requireAdminSession("/admin");
  const isSuperAdmin = session.role === "super_admin";
  const sections = SECTIONS.filter((s) => !s.superAdminOnly || isSuperAdmin);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow={`Admin · the back office`}
        title="Mission control."
        description={
          <>
            Welcome back, <strong className="font-semibold text-ink-900">{session.displayName}</strong>.
            Everything you need to run the kudos program. The public leaderboard stays public; everything
            below is gated to admins.
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group relative flex h-full flex-col items-start gap-3 overflow-hidden rounded-2xl border border-ink-200 bg-card p-6 text-left transition-all hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-[0_8px_24px_-12px_rgba(22,22,20,0.18)]"
          >
            <span
              aria-hidden
              className={cn(
                "absolute left-0 top-0 h-1 w-12 rounded-r-full transition-all group-hover:w-24",
                ACCENT_BAR[s.accent],
              )}
            />
            <h3 className="mt-2 font-display text-2xl italic text-ink-900">
              {s.title}
            </h3>
            <p className="text-sm text-ink-500">{s.desc}</p>
            <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-ink-700 transition-colors group-hover:text-ink-900">
              Open
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-200 bg-card p-6">
          <div className="min-w-0">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-400">
              Public surface
            </p>
            <p className="mt-1 font-display text-2xl italic text-ink-900">
              The leaderboard is open to your workspace.
            </p>
            <p className="mt-1 text-sm text-ink-500">
              The one place where API access doesn&rsquo;t require an admin session.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-900 px-4 text-sm font-medium text-paper transition-colors hover:bg-ink-800"
          >
            Open leaderboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
