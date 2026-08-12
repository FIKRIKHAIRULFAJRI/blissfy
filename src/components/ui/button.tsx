import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "soft" | "ghost";
type ButtonSize = "default" | "large" | "compact";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-surface hover:bg-olive focus-visible:outline-olive",
  secondary:
    "border border-ink bg-transparent text-ink hover:bg-ink hover:text-surface",
  soft:
    "bg-surface-muted text-ink hover:bg-border focus-visible:outline-olive",
  ghost: "bg-transparent text-ink hover:text-olive",
};

const sizes: Record<ButtonSize, string> = {
  default: "min-h-12 px-5 py-3 text-sm",
  large: "min-h-14 px-6 py-4 text-base",
  compact: "min-h-10 px-4 py-2 text-sm",
};

export function buttonClasses({
  className,
  size = "default",
  variant = "primary",
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold leading-none transition-colors duration-200",
    "disabled:bg-surface-muted disabled:text-ink-muted",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ className, size, variant })}
      type={type}
      {...props}
    />
  );
}
