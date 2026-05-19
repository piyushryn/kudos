"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetLeaderboardBySlackAction } from "@/app/admin/(protected)/leaderboard-reset/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LeaderboardResetBySlackForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <form
      className="flex w-full max-w-[600px] flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        const form = e.currentTarget;
        const fd = new FormData(form);
        const slackUserId = String(fd.get("slackUserId") ?? "").trim();
        if (
          !window.confirm(
            `Reset leaderboard totals for Slack user ${slackUserId || "(empty)"}? Past kudos stay in the audit log; a new admin entry is added.`,
          )
        ) {
          return;
        }
        startTransition(async () => {
          const result = await resetLeaderboardBySlackAction(slackUserId);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          form.reset();
          router.refresh();
        });
      }}
    >
      <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-ink-700">
        Slack User ID
        <Input
          name="slackUserId"
          type="text"
          placeholder="U01234567"
          autoComplete="off"
          required
          disabled={pending}
          className="bg-card font-mono"
        />
      </label>
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Resetting…" : "Reset user by Slack ID"}
      </Button>
      {error ? <p className="text-sm text-coral-700">{error}</p> : null}
    </form>
  );
}
