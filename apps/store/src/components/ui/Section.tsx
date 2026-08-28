import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SectionElement = "article" | "div" | "section";
type SectionSpacing = "large" | "none" | "normal";

const spacingClasses: Record<SectionSpacing, string> = {
  large: "py-[var(--space-6)]",
  none: "",
  normal: "py-[var(--space-5)]",
};

type SectionProps = HTMLAttributes<HTMLElement> & {
  as?: SectionElement;
  spacing?: SectionSpacing;
};

/** Standard storefront vertical rhythm using only the exact Stitch scale. */
export function Section({
  as: Component = "section",
  className,
  spacing = "normal",
  ...props
}: SectionProps) {
  return (
    <Component
      className={cn(spacingClasses[spacing], className)}
      {...props}
    />
  );
}
