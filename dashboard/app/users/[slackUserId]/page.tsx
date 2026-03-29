import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { fetchUserStats } from "@/lib/api";

type UserStatsPageProps = {
  params: Promise<{ slackUserId: string }>;
};

export default async function UserStatsPage({ params }: UserStatsPageProps) {
  const { slackUserId } = await params;
  const stats = await fetchUserStats(slackUserId);
  const cat = stats.userCategory;

  return (
    <>
      <PageHeader title={stats.displayName} description={<code>{stats.slackUserId}</code>} />
      <div className="grid">
        <StatCard label="Total given" value={stats.totalGiven} />
        <StatCard label="Total received" value={stats.totalReceived} />
        <StatCard label="Remaining this month" value={stats.remainingBalance} />
        <StatCard label="Effective monthly quota" value={stats.effectiveMonthlyQuota} />
        <StatCard label="Category" value={`${cat.name} (${cat.key})`} />
        <StatCard label="Category quota" value={cat.monthlyGivingQuota ?? "Workspace default"} />
        <StatCard label="Workspace default" value={stats.workspaceDefaultMonthlyBalance} />
      </div>
    </>
  );
}
