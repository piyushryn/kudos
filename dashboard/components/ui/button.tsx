import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 focus-visible:ring-offset-1 focus-visible:ring-offset-paper",
  {
    variants: {
      variant: {
        default: "bg-ink-900 text-paper hover:bg-ink-800",
        primary: "bg-leaf-600 text-paper hover:bg-leaf-700",
        secondary:
          "border border-ink-200 bg-card text-ink-700 hover:bg-paper-2 hover:text-ink-900",
        destructive: "bg-coral-600 text-paper hover:bg-coral-700",
        outline:
          "border border-ink-200 bg-card text-ink-700 hover:bg-paper-2 hover:text-ink-900",
        ghost: "text-ink-700 hover:bg-ink-200/50 hover:text-ink-900",
        link: "text-ink-900 underline decoration-leaf-500 decoration-2 underline-offset-4 hover:decoration-ink-900",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
