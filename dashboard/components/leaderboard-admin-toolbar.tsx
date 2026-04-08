import { LeaderboardResetAllButton } from "@/components/leaderboard-reset-all-button";
import { LeaderboardResetBySlackForm } from "@/components/leaderboard-reset-by-slack-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LeaderboardAdminToolbar() {
  return (
    <div className="mb-4 grid gap-6 md:grid-cols-2">
      <Card aria-label="Admin leaderboard controls">
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
            Admin: reset individual scores
          </CardTitle>
          <p className="text-sm text-slate-500">
          Stops their past kudos from counting toward leaderboard totals and adds a row to the audit log. Nothing is
          deleted. Monthly balances are unchanged — use Quotas to refill balances.
          </p>
        </CardHeader>
        <CardContent>
          <LeaderboardResetBySlackForm />
        </CardContent>
      </Card>
      <Card aria-label="Admin leaderboard controls">
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Admin: reset all scores</CardTitle>
          <p className="text-sm text-slate-500">
          Stops all past kudos from counting toward leaderboard totals and adds a row to the audit log. Nothing is
          deleted. Monthly balances are unchanged — use Quotas to refill balances.
          </p>
        </CardHeader>
        <CardContent>
          <LeaderboardResetAllButton />
        </CardContent>
      </Card>
    </div>
  );
}
