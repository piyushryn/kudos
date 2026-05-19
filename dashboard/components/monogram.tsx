import { cn } from "@/lib/utils";

const AVATAR_TINTS = [
  { bg: "bg-leaf-100", ring: "ring-leaf-200", text: "text-leaf-700" },
  { bg: "bg-coral-100", ring: "ring-coral-200", text: "text-coral-700" },
  { bg: "bg-violet-100", ring: "ring-violet-100", text: "text-violet-700" },
  { bg: "bg-ink-200", ring: "ring-ink-200", text: "text-ink-700" },
] as const;

/** Deterministic palette tint from a display name. */
function tintFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
  sm: "size-7 text-[10px]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
};

export function Monogram({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: Size;
  className?: string;
}) {
  const t = tintFor(name);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide ring-1 ring-inset",
        sizeClass[size],
        t.bg,
        t.text,
        t.ring,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
