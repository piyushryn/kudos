import { LeaderboardResetAllButton } from "@/components/leaderboard-reset-all-button";
import { LeaderboardResetBySlackForm } from "@/components/leaderboard-reset-by-slack-form";

export function LeaderboardAdminToolbar() {
  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <div
        className="card leaderboardAdminToolbar"
        aria-label="Admin leaderboard controls"
      >
        <h2 className="cardTitle">Admin: reset individual scores</h2>
        <p
          className="muted"
          style={{ fontSize: "0.875rem", marginBottom: "1rem" }}
        >
          Deletes kudos transactions (all-time totals and audit log rows).
          Monthly giving balances are unchanged — use Quotas to refill balances.
        </p>
        <div className="">
          <LeaderboardResetBySlackForm />
        </div>
      </div>
      <div
        className="card leaderboardAdminToolbar"
        aria-label="Admin leaderboard controls"
      >
        <h2 className="cardTitle">Admin: reset all scores</h2>
        <p
          className="muted"
          style={{ fontSize: "0.875rem", marginBottom: "1rem" }}
        >
          Deletes kudos transactions (all-time totals and audit log rows).
          Monthly giving balances are unchanged — use Quotas to refill balances.
        </p>
        <div>
          <LeaderboardResetAllButton />
        </div>
      </div>
    </div>
  );
}
