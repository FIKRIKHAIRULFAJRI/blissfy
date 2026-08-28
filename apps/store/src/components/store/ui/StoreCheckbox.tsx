import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type StoreCheckboxProps = ComponentPropsWithoutRef<"input">;

export function StoreCheckbox({
  className,
  ...props
}: StoreCheckboxProps) {
  return (
    <input
      className={cn(
        "h-5 w-5 shrink-0",
        "rounded-[var(--radius-sm)]",
        "border border-[var(--color-border-strong)]",
        "bg-[var(--color-surface)]",
        "accent-[var(--color-action-primary)]",
        "text-[var(--color-action-primary)]",
        "transition-[border-color,box-shadow,background-color]",
        "duration-[var(--duration-fast)]",
        "ease-[var(--ease-blissfy)]",
        "hover:border-[var(--color-action-primary)]",
        "focus:outline-none",
        "focus-visible:outline-2",
        "focus-visible:outline-offset-2",
        "focus-visible:outline-[var(--color-action-primary)]",
        "disabled:cursor-not-allowed",
        "disabled:border-[var(--color-border)]",
        "disabled:bg-[var(--color-disabled)]",
        "aria-invalid:border-[var(--color-error)]",
        "aria-invalid:focus-visible:outline-[var(--color-error)]",
        className,
      )}
      type="checkbox"
      {...props}
    />
  );
}