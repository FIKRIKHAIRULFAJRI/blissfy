import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function StoreFooter() {
  return (
    <footer className="mt-[var(--space-6)] border-t border-[var(--color-border-strong)] bg-[var(--color-text-brand)] text-[var(--color-action-primary-text)]">
      <Container className="grid gap-[var(--space-5)] py-[var(--space-5)] md:grid-cols-2 lg:grid-cols-12 lg:gap-[var(--space-4)] lg:py-[var(--space-6)]">
        <div className="lg:col-span-5">
          <Link
            className="text-heading inline-flex min-h-11 items-center text-[var(--color-surface)] transition-colors hover:text-[var(--color-action-primary-text)] focus-visible:outline-[var(--color-surface)]"
            href="/"
          >
            blissfy.co
          </Link>
          <p className="text-body mt-[var(--space-3)] max-w-md text-[var(--color-surface-high)]">
            Elevating everyday essentials through mindful design and spatial
            luxury.
          </p>
        </div>
        <section
          aria-labelledby="footer-social-heading"
          className="lg:col-span-4 lg:col-start-7"
        >
          <h2
            className="text-label uppercase text-[var(--color-surface-high)]"
            id="footer-social-heading"
          >
            Follow us
          </h2>
          <ul className="mt-[var(--space-3)]">
            <li className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--color-surface)]">
              Instagram: @blissfy.co
            </li>
            <li className="flex min-h-11 items-center text-sm font-medium text-[var(--color-surface)]">
              TikTok: @blissfy.co
            </li>
          </ul>
        </section>
        <p className="text-sm leading-6 text-[var(--color-surface-high)] md:col-span-2 lg:col-span-2 lg:col-start-11 lg:row-start-1 lg:justify-self-end lg:text-right">
          © 2026 blissfy.co. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
