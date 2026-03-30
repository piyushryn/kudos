"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetLeaderboardBySlackAction } from "@/app/admin/(protected)/leaderboard-reset/actions";

export function LeaderboardResetBySlackForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <form
      className="formGrid"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        const fd = new FormData(e.currentTarget);
        const slackUserId = String(fd.get("slackUserId") ?? "").trim();
        if (
          !window.confirm(
            `Remove all kudos where Slack user ${slackUserId || "(empty)"} gave or received?`,
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
          e.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <label>
        Slack User ID (reset scores)
        <input
          name="slackUserId"
          type="text"
          className="input"
          placeholder="U01234567"
          autoComplete="off"
          required
          disabled={pending}
        />
      </label>
      <button type="submit" className="button dangerButton" disabled={pending}>
        {pending ? "Resetting…" : "Reset user by Slack ID"}
      </button>
      {error ? <p className="errorText">{error}</p> : null}
    </form>
  );
}
