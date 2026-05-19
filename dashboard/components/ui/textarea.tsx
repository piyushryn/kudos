import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-ink-200 bg-paper-2/40 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus-visible:border-ink-900 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/10 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
