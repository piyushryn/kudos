"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetLeaderboardUserAction } from "@/app/admin/(protected)/leaderboard-reset/actions";

type Props = {
  userId: string;
  displayName: string;
};

export function LeaderboardResetUserButton({ userId, displayName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const onClick = () => {
    setError("");
    if (
      !window.confirm(
        `Remove all kudos where ${displayName} gave or received points? This updates the leaderboard and removes those audit rows.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await resetLeaderboardUserAction(userId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <span className="leaderboardRowActions">
      <button
        type="button"
        className="button dangerButton buttonSmall"
        onClick={onClick}
        disabled={pending}
        title={`Reset scores for ${displayName}`}
      >
        {pending ? "…" : "Reset"}
      </button>
      {error ? <span className="errorText" style={{ fontSize: "0.75rem" }}>{error}</span> : null}
    </span>
  );
}
