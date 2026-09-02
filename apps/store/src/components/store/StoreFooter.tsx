import Link from "next/link";

import { Container } from "@/components/ui/Container";

export function StoreFooter({
  variant = "default",
}: {
  variant?: "default" | "editorial";
}) {
  const isEditorial = variant === "editorial";

  return (
    <footer
      className={
        isEditorial
          ? "mt-20 border-t border-white/15 bg-[var(--color-text-brand)] text-white"
          : "mt-[var(--space-6)] border-t border-[var(--color-border-strong)] bg-[var(--color-text-brand)] text-white"
      }
    >
      <Container
        className={
          isEditorial
            ? "grid max-w-[1200px] items-start gap-10 px-5 py-16 sm:gap-12 sm:px-6 sm:py-[72px] lg:grid-cols-[1.1fr_0.8fr_1.1fr] lg:py-24"
            : "grid gap-[var(--space-5)] py-[var(--space-5)] lg:grid-cols-3 lg:gap-[var(--space-4)] lg:py-[var(--space-6)]"
        }
      >
        <div>
          <Link
            className={
              isEditorial
                ? "inline-flex min-h-11 items-center font-goudy-old-style text-[32px] font-normal leading-none tracking-[-0.012em] text-white focus-visible:outline-white"
                : "text-heading inline-flex min-h-11 items-center text-white transition-colors hover:text-white focus-visible:outline-white"
            }
            href="/"
          >
            blissfy.co
          </Link>
          <p
            className={
              isEditorial
                ? "mt-6 max-w-xs text-sm leading-normal text-white/70"
                : "text-body mt-[var(--space-3)] max-w-md text-white"
            }
          >
            Elevating everyday essentials through mindful design and spatial
            luxury.
          </p>
        </div>
        <section
          aria-labelledby="footer-social-heading"
          className={
            isEditorial
              ? "text-left lg:justify-self-center"
              : "text-left lg:text-center"
          }
        >
          <h2
            className={
              isEditorial
                ? "text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-white/70"
                : "text-label uppercase text-white"
            }
            id="footer-social-heading"
          >
            Follow us
          </h2>
          <ul
            className={
              isEditorial
                ? "mt-[18px] flex flex-col items-start"
                : "mt-[var(--space-3)] flex flex-col items-start lg:items-center"
            }
          >
            <li
              className={
                isEditorial
                  ? "inline-flex min-h-9 items-center text-sm font-normal text-white"
                  : "inline-flex min-h-11 items-center text-sm font-medium text-white"
              }
            >
              Instagram: @blissfy.co
            </li>
            <li
              className={
                isEditorial
                  ? "inline-flex min-h-9 items-center text-sm font-normal text-white"
                  : "inline-flex min-h-11 items-center text-sm font-medium text-white"
              }
            >
              TikTok: @blissfy.co
            </li>
          </ul>
        </section>
        <p
          className={
            isEditorial
              ? "text-left text-xs leading-normal text-white/70 lg:justify-self-end lg:text-right lg:whitespace-nowrap"
              : "text-left text-sm leading-6 text-white lg:justify-self-center lg:text-center lg:whitespace-nowrap"
          }
        >
          © 2026 blissfy.co. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
