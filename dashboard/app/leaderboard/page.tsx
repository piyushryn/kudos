import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLeaderboard } from "@/lib/api";

export default async function LeaderboardPage() {
  const leaderboard = await fetchLeaderboard();

  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="Top givers and receivers by total kudos points."
      />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Top givers</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="mt-1 divide-y divide-slate-200">
            {leaderboard.topGivers.map((entry) => (
                <li key={entry.userId} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                  <span>{entry.displayName}</span>
                  <strong className="font-semibold text-emerald-700">{entry.points}</strong>
              </li>
            ))}
              </ol>
            </CardContent>
          </Card>
        </section>
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Top receivers</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="mt-1 divide-y divide-slate-200">
            {leaderboard.topReceivers.map((entry) => (
                <li key={entry.userId} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                  <span>{entry.displayName}</span>
                  <strong className="font-semibold text-emerald-700">{entry.points}</strong>
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
