import { PageHeader } from "@/components/page-header";
import { fetchLeaderboard } from "@/lib/api";

export default async function LeaderboardPage() {
  const leaderboard = await fetchLeaderboard();

  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="Top givers and receivers by total kudos points."
      />
      <div className="grid">
        <section className="card">
          <h2 className="cardTitle">Top givers</h2>
          <ol className="list">
            {leaderboard.topGivers.map((entry) => (
              <li key={entry.userId}>
                <span>{entry.displayName}</span>
                <strong>{entry.points}</strong>
              </li>
            ))}
          </ol>
        </section>
        <section className="card">
          <h2 className="cardTitle">Top receivers</h2>
          <ol className="list">
            {leaderboard.topReceivers.map((entry) => (
              <li key={entry.userId}>
                <span>{entry.displayName}</span>
                <strong>{entry.points}</strong>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
