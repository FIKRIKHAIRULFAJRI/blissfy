import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function StoreFooter() {
  return (
    <footer className="mt-[var(--space-6)] border-t border-[var(--color-border-strong)] bg-[var(--color-text-brand)] text-white">
      <Container className="grid gap-[var(--space-5)] py-[var(--space-5)] lg:grid-cols-3 lg:gap-[var(--space-4)] lg:py-[var(--space-6)]">
        <div>
          <Link
            className="text-heading inline-flex min-h-11 items-center text-white transition-colors hover:text-white focus-visible:outline-white"
            href="/"
          >
            blissfy.co
          </Link>
          <p className="text-body mt-[var(--space-3)] max-w-md text-white">
            Elevating everyday essentials through mindful design and spatial
            luxury.
          </p>
        </div>
        <section
          aria-labelledby="footer-social-heading"
          className="text-left lg:text-center"
        >
          <h2
            className="text-label uppercase text-white"
            id="footer-social-heading"
          >
            Follow us
          </h2>
          <ul className="mt-[var(--space-3)] flex flex-col items-start lg:items-center">
            <li className="inline-flex min-h-11 items-center text-sm font-medium text-white">
              Instagram: @blissfy.co
            </li>
            <li className="inline-flex min-h-11 items-center text-sm font-medium text-white">
              TikTok: @blissfy.co
            </li>
          </ul>
        </section>
        <p className="text-left text-sm leading-6 text-white lg:justify-self-center lg:text-center lg:whitespace-nowrap">
          © 2026 blissfy.co. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
