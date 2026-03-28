import { fetchLeaderboard } from "../../lib/api";

export default async function LeaderboardPage() {
  const leaderboard = await fetchLeaderboard();

  return (
    <div className="grid">
      <section className="card">
        <h2>Top givers</h2>
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
        <h2>Top receivers</h2>
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
  );
}
