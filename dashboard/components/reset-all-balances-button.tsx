"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetAllBalancesAction } from "@/app/admin/(protected)/quotas/actions";
import { Button } from "@/components/ui/button";

export function ResetAllBalancesButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const onClick = () => {
    setError("");
    if (
      !window.confirm(
        "Reset every user’s current-month balance to their effective monthly quota? Spent points this month will be restored to the full quota.",
      )
    ) {
      return;
    }
    if (!window.confirm("This affects all users. Click OK to confirm again.")) {
      return;
    }
    startTransition(async () => {
      const result = await resetAllBalancesAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/quotas?notice=" + encodeURIComponent("All balances reset for the current month."));
      router.refresh();
    });
  };

  return (
    <div className="flex w-full max-w-[600px] flex-col items-start gap-1.5">
      <Button type="button" variant="destructive" onClick={onClick} disabled={pending}>
        {pending ? "Resetting…" : "Reset all users’ monthly balances"}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
