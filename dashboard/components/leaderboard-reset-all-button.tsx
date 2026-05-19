"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetLeaderboardAllAction } from "@/app/admin/(protected)/leaderboard-reset/actions";
import { Button } from "@/components/ui/button";

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
    <div className="flex w-full max-w-[600px] flex-col items-start gap-2">
      <Button type="button" variant="destructive" onClick={onClick} disabled={pending}>
        {pending ? "Resetting…" : "Reset entire leaderboard"}
      </Button>
      {error ? <p className="text-sm text-coral-700">{error}</p> : null}
    </div>
  );
}
