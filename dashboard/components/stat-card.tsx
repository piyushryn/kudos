import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number | string;
  /** Accent for the value typography. Defaults to neutral ink. */
  accent?: "leaf" | "coral" | "violet";
  className?: string;
};

const accentColor: Record<NonNullable<StatCardProps["accent"]>, string> = {
  leaf: "text-leaf-700",
  coral: "text-coral-600",
  violet: "text-violet-700",
};

export function StatCard({ label, value, accent, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-200 bg-card p-5 transition-colors hover:border-ink-300",
        className,
      )}
    >
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 font-display text-5xl italic leading-none tabular-nums",
          accent ? accentColor[accent] : "text-ink-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}
