"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetLeaderboardAllAction } from "@/app/admin/(protected)/leaderboard-reset/actions";

export function LeaderboardResetAllButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const onClick = () => {
    setError("");
    if (
      !window.confirm(
        "Reset leaderboard totals for everyone? All past kudos stay in the audit log; a new admin entry is added. Those rows no longer count toward leaderboard or profile totals. Monthly balances are not changed.",
      )
    ) {
      return;
    }
    if (!window.confirm("Confirm full workspace leaderboard reset.")) {
      return;
    }
    startTransition(async () => {
      const result = await resetLeaderboardAllAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="formActions">
      <button type="button" className="button dangerButton" onClick={onClick} disabled={pending}>
        {pending ? "Resetting…" : "Reset entire leaderboard"}
      </button>
      {error ? <p className="errorText">{error}</p> : null}
    </div>
  );
}
