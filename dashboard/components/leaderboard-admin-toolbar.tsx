import { LeaderboardResetAllButton } from "@/components/leaderboard-reset-all-button";
import { LeaderboardResetBySlackForm } from "@/components/leaderboard-reset-by-slack-form";

export function LeaderboardAdminToolbar() {
  return (
    <section className="grid gap-5 md:grid-cols-2">
      <div
        aria-label="Admin leaderboard controls — single user"
        className="rounded-2xl border border-coral-200 bg-coral-100/30 p-6"
      >
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-coral-700">
          Reset one person
        </p>
        <p className="mt-1 max-w-[60ch] text-sm text-ink-700">
          Stops their past kudos from counting toward leaderboard totals and adds a row to
          the audit log. Nothing is deleted. Monthly balances are unchanged — use Quotas to
          refill balances.
        </p>
        <div className="mt-5">
          <LeaderboardResetBySlackForm />
        </div>
      </div>

      <div
        aria-label="Admin leaderboard controls — all users"
        className="rounded-2xl border border-coral-200 bg-coral-100/30 p-6"
      >
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-coral-700">
          Reset everyone
        </p>
        <p className="mt-1 max-w-[60ch] text-sm text-ink-700">
          Stops all past kudos from counting toward leaderboard totals and adds a row to the
          audit log. Nothing is deleted. Monthly balances are unchanged — use Quotas to
          refill balances.
        </p>
        <div className="mt-5">
          <LeaderboardResetAllButton />
        </div>
      </div>
    </section>
  );
}
