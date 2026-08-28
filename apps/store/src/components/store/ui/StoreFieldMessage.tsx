import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type StoreFieldMessageVariant = "error" | "hint";

type StoreFieldMessageProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: StoreFieldMessageVariant;
};

const variants: Record<StoreFieldMessageVariant, string> = {
  error: "text-[var(--color-error)]",
  hint: "text-[var(--color-text-muted)]",
};

export function StoreFieldMessage({
  children,
  className,
  variant = "hint",
  ...props
}: StoreFieldMessageProps) {
  return (
    <span
      className={cn(
        "text-sm leading-5",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}