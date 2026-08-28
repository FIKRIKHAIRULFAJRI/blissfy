import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type StoreTextareaProps = ComponentPropsWithoutRef<"textarea">;

export function StoreTextarea({
  className,
  ...props
}: StoreTextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y",
        "rounded-[var(--radius-control)]",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
        "px-4 py-3",
        "text-base text-[var(--color-text-primary)]",
        "placeholder:text-[var(--color-text-muted)]",
        "transition-[border-color,box-shadow,background-color]",
        "duration-[var(--duration-fast)]",
        "ease-[var(--ease-blissfy)]",
        "hover:border-[var(--color-border-strong)]",
        "focus:border-[var(--color-action-primary)]",
        "focus:outline-none",
        "focus-visible:outline-2",
        "focus-visible:outline-offset-2",
        "focus-visible:outline-[var(--color-action-primary)]",
        "disabled:cursor-not-allowed",
        "disabled:border-[var(--color-border)]",
        "disabled:bg-[var(--color-disabled)]",
        "disabled:text-[var(--color-disabled-text)]",
        "aria-invalid:border-[var(--color-error)]",
        "aria-invalid:focus-visible:outline-[var(--color-error)]",
        className,
      )}
      {...props}
    />
  );
}