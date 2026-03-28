import { fetchUserStats } from "../../../lib/api";
import { StatCard } from "../../../components/stat-card";

type UserStatsPageProps = {
  params: Promise<{ slackUserId: string }>;
};

export default async function UserStatsPage({ params }: UserStatsPageProps) {
  const { slackUserId } = await params;
  const stats = await fetchUserStats(slackUserId);

  return (
    <div className="stack">
      <h2>{stats.displayName}</h2>
      <p className="muted">{stats.slackUserId}</p>
      <div className="grid">
        <StatCard label="Total given" value={stats.totalGiven} />
        <StatCard label="Total received" value={stats.totalReceived} />
        <StatCard label="Remaining this month" value={stats.remainingBalance} />
      </div>
    </div>
  );
}
