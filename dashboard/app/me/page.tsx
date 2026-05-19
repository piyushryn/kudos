import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMyUserStats } from "@/lib/admin-api";
import { requireUserSession } from "@/lib/require-user-session";

export default async function MyStatsPage() {
  await requireUserSession("/me");
  const stats = await fetchMyUserStats();
  const cat = stats.userCategory;

  return (
    <>
      <PageHeader title={stats.displayName} description={<code>{stats.slackUserId}</code>} />
      <div className="space-y-5">
        <section>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Total given" value={stats.totalGiven} />
            <StatCard label="Total received" value={stats.totalReceived} />
            <StatCard label="Remaining this month" value={stats.remainingBalance} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Monthly quota</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <StatCard label="Effective monthly quota" value={stats.effectiveMonthlyQuota} />
                <StatCard label="Workspace default" value={stats.workspaceDefaultMonthlyBalance} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Profile and policy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <StatCard label="Category" value={`${cat.name} (${cat.key})`} />
                <StatCard label="Category quota" value={cat.monthlyGivingQuota ?? "Workspace default"} />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
