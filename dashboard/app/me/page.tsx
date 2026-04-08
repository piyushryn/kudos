import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { fetchMyUserStats } from "@/lib/api";
import { requireUserSession } from "@/lib/require-user-session";

export default async function MyStatsPage() {
  const session = await requireUserSession("/me");
  const stats = await fetchMyUserStats(session.token);
  const cat = stats.userCategory;

  return (
    <>
      <PageHeader title={stats.displayName} description={<code>{stats.slackUserId}</code>} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
