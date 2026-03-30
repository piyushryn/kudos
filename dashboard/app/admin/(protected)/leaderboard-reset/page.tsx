import Link from "next/link";

import { LeaderboardAdminToolbar } from "@/components/leaderboard-admin-toolbar";
import { LeaderboardResetUserButton } from "@/components/leaderboard-reset-user-button";
import { PageHeader } from "@/components/page-header";
import { fetchLeaderboard } from "@/lib/api";

export default async function AdminLeaderboardResetPage() {
  const leaderboard = await fetchLeaderboard();

  return (
    <>
      <PageHeader
        title="Leaderboard reset"
        description="Clear displayed all-time totals by excluding past kudos from counts and appending an admin line to the audit log. Historical rows are never deleted. Open the public leaderboard in another tab to compare."
      />

      <p className="muted" style={{ marginBottom: "1rem" }}>
        <Link href="/leaderboard" className="linkInline">
          View public leaderboard
        </Link>
      </p>

      <LeaderboardAdminToolbar />

      <div className="grid">
        <section className="card">
          <h2 className="cardTitle">Top givers (reset per person)</h2>
          <ol className="list">
            {leaderboard.topGivers.map((entry) => (
              <li key={entry.userId} className="leaderboardEntry">
                <span className="leaderboardEntryName">{entry.displayName}</span>
                <strong>{entry.points}</strong>
                <LeaderboardResetUserButton userId={entry.userId} displayName={entry.displayName} />
              </li>
            ))}
          </ol>
        </section>
        <section className="card">
          <h2 className="cardTitle">Top receivers (reset per person)</h2>
          <ol className="list">
            {leaderboard.topReceivers.map((entry) => (
              <li key={entry.userId} className="leaderboardEntry">
                <span className="leaderboardEntryName">{entry.displayName}</span>
                <strong>{entry.points}</strong>
                <LeaderboardResetUserButton userId={entry.userId} displayName={entry.displayName} />
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
