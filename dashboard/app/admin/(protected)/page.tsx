import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminHomePage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Leaderboards, per-user stats, and audit history for your Slack kudos program."
      />

      <div className="space-y-5">
        <Card className="border-none bg-gradient-to-br from-teal-700 via-emerald-600 to-teal-800 p-6 text-white shadow-md">
          <p className="mb-5 max-w-[40ch] text-base leading-relaxed text-emerald-50">
            You’re signed in to the admin area. The leaderboard remains public; this dashboard also uses the API{" "}
            <code>DASHBOARD_SERVICE_TOKEN</code> for server actions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="border-emerald-200 bg-white text-teal-700 hover:bg-emerald-50">
              <Link href="/leaderboard">Leaderboard</Link>
            </Button>
            <Button asChild className="bg-white/20 text-white hover:bg-white/30">
              <Link href="/admin/audit-log">Audit log</Link>
            </Button>
          </div>
        </Card>

        <Card className="border-dashed px-4 py-3 text-sm text-slate-600">
          <strong className="font-semibold text-slate-900">Security model:</strong> user stats are now self-scope
          only under <code>/me</code>; arbitrary Slack ID lookups are blocked.
        </Card>
      </div>
    </>
  );
}
