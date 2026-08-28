import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export type StoreButtonVariant =
  | "primary"
  | "secondary"
  | "soft"
  | "ghost"
  | "destructive";

export type StoreButtonSize = "default" | "large" | "compact";

const variants: Record<StoreButtonVariant, string> = {
  primary:
    "bg-[var(--color-action-primary)] text-[var(--color-action-primary-text)] hover:bg-[color-mix(in_srgb,var(--color-action-primary)_90%,white)]",

  secondary:
    "border border-[var(--color-action-primary)] bg-transparent text-[var(--color-action-primary)] hover:bg-[var(--color-surface-low)]",

  soft:
    "bg-[var(--color-surface-container)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-high)]",

  ghost:
    "bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-low)]",

  destructive:
    "bg-[var(--color-error-surface)] text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error-surface)_85%,var(--color-error))]",
};

const sizes: Record<StoreButtonSize, string> = {
  compact: "min-h-11 px-4 py-2 text-sm",
  default: "min-h-12 px-5 py-3 text-sm",
  large: "min-h-12 px-6 py-3 text-base",
};

export function storeButtonClasses({
  className,
  size = "default",
  variant = "primary",
}: {
  className?: string;
  size?: StoreButtonSize;
  variant?: StoreButtonVariant;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2",
    "rounded-[var(--radius-control)]",
    "font-semibold leading-none",
    "transition-[background-color,color,border-color,box-shadow,transform]",
    "duration-[var(--duration-default)]",
    "ease-[var(--ease-blissfy)]",
    "focus-visible:outline-2",
    "focus-visible:outline-offset-3",
    "focus-visible:outline-[var(--color-action-primary)]",
    "disabled:cursor-not-allowed",
    "disabled:bg-[var(--color-disabled)]",
    "disabled:text-[var(--color-disabled-text)]",
    "disabled:border-[var(--color-border)]",
    variants[variant],
    sizes[size],
    className,
  );
}

type StoreButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: StoreButtonVariant;
  size?: StoreButtonSize;
};

export function StoreButton({
  className,
  size,
  type = "button",
  variant,
  ...props
}: StoreButtonProps) {
  return (
    <button
      className={storeButtonClasses({
        className,
        size,
        variant,
      })}
      type={type}
      {...props}
    />
  );
}