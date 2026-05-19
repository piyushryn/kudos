import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest",
  {
    variants: {
      variant: {
        default: "border-ink-200 bg-paper-2 text-ink-700",
        secondary: "border-leaf-200 bg-leaf-50 text-leaf-700",
        destructive: "border-coral-200 bg-coral-100/50 text-coral-700",
        violet: "border-violet-100 bg-violet-100 text-violet-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
