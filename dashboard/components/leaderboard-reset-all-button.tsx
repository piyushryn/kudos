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
        "Delete all kudos transactions? The leaderboard and audit log will be cleared. Monthly balances are not changed.",
      )
    ) {
      return;
    }
    if (!window.confirm("This cannot be undone. Confirm again.")) {
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
