import Link from "next/link";

import { LeaderboardAdminToolbar } from "@/components/leaderboard-admin-toolbar";
import { LeaderboardResetUserButton } from "@/components/leaderboard-reset-user-button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLeaderboard } from "@/lib/api";

export default async function AdminLeaderboardResetPage() {
  const leaderboard = await fetchLeaderboard();

  return (
    <>
      <PageHeader
        title="Leaderboard reset"
        description="Clear displayed all-time totals by excluding past kudos from counts and appending an admin line to the audit log. Historical rows are never deleted. Open the public leaderboard in another tab to compare."
      />

      <p className="mb-4 text-sm text-slate-500">
        <Link href="/leaderboard" className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800">
          View public leaderboard
        </Link>
      </p>

      <LeaderboardAdminToolbar />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
                Top givers (reset per person)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="mt-1 divide-y divide-slate-200">
            {leaderboard.topGivers.map((entry) => (
                <li key={entry.userId} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">{entry.displayName}</span>
                  <strong className="font-semibold text-emerald-700">{entry.points}</strong>
                <LeaderboardResetUserButton userId={entry.userId} displayName={entry.displayName} />
              </li>
            ))}
              </ol>
            </CardContent>
          </Card>
        </section>
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
                Top receivers (reset per person)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="mt-1 divide-y divide-slate-200">
            {leaderboard.topReceivers.map((entry) => (
                <li key={entry.userId} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">{entry.displayName}</span>
                  <strong className="font-semibold text-emerald-700">{entry.points}</strong>
                <LeaderboardResetUserButton userId={entry.userId} displayName={entry.displayName} />
              </li>
            ))}
              </ol>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
