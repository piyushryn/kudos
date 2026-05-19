"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetLeaderboardUserAction } from "@/app/admin/(protected)/leaderboard-reset/actions";
import { Button } from "@/components/ui/button";

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
        `Reset leaderboard totals for ${displayName}? Their past kudos stay in the audit log and a new admin entry is added; those rows stop counting toward totals.`,
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
    <span className="inline-flex shrink-0 flex-col items-end gap-1">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onClick}
        disabled={pending}
        title={`Reset scores for ${displayName}`}
      >
        {pending ? "…" : "Reset"}
      </Button>
      {error ? <span className="text-xs text-coral-700">{error}</span> : null}
    </span>
  );
}
