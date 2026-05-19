import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LeaderboardAdminToolbar } from "@/components/leaderboard-admin-toolbar";
import { PageHeader } from "@/components/page-header";

export default async function AdminLeaderboardResetPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · leaderboard reset"
        title="Clear the board."
        description="Stops past kudos from counting toward all-time totals and appends an admin row to the audit log. Historical rows are never deleted. Open the public leaderboard in another tab to compare."
        actions={
          <Link
            href="/leaderboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-ink-200 bg-card px-3 text-xs font-medium text-ink-700 transition-colors hover:bg-paper-2 hover:text-ink-900"
          >
            View public leaderboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <LeaderboardAdminToolbar />
    </div>
  );
}
