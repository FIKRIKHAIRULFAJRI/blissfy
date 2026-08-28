import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ContainerElement = "div" | "header" | "main" | "section";

type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ContainerElement;
};

/**
 * Shared storefront alignment container.
 *
 * The 20px mobile and 60px desktop margins are exact Stitch values. The
 * 1440px cap is a Recommended implementation safeguard retained from the
 * existing storefront because Stitch does not expose an exact max-width.
 */
export function Container({
  as: Component = "div",
  className,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full max-w-[1440px] px-[var(--page-margin-mobile)] lg:px-[var(--page-margin-desktop)]",
        className,
      )}
      {...props}
    />
  );
}
