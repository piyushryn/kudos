import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  /** Tiny mono uppercase eyebrow above the title. */
  eyebrow?: string;
  /** The big editorial line. Italic display serif. */
  title: string;
  /** Sans body copy under the title. */
  description?: ReactNode;
  /** Optional right-aligned slot (e.g. a "Back" button). */
  actions?: ReactNode;
  /** Cap the font-size range. "lg" = up to 6rem (leaderboard hero), "md" = up to 4rem (regular pages). */
  size?: "md" | "lg";
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  size = "md",
  className,
}: PageHeaderProps) {
  const titleSize =
    size === "lg"
      ? "text-[clamp(3rem,8vw,5.5rem)]"
      : "text-[clamp(2.25rem,6vw,4rem)]";

  return (
    <header className={cn("space-y-4 pt-2", className)}>
      {eyebrow ? (
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-ink-400">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "font-display italic leading-[0.95] tracking-tight text-ink-900",
          titleSize,
        )}
      >
        {title}
      </h1>
      {description != null && description !== "" ? (
        <div className="max-w-[56ch] text-base text-ink-600">{description}</div>
      ) : null}
      {actions ? <div className="pt-1">{actions}</div> : null}
    </header>
  );
}
