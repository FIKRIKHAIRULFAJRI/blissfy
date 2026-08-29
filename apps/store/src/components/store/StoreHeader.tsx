import Link from "next/link";

import { CartCountBadge } from "@/components/store/CartCountBadge";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Track Order", href: "/order/track" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
];

const utilityLinkClasses =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-transparent transition-[background-color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-blissfy)] hover:bg-[var(--color-canvas)] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-brand)] focus-visible:ring-offset-2";

export function StoreHeader({ activePath }: { activePath?: string }) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Lewati ke konten
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-[var(--space-2)] lg:grid lg:h-20 lg:grid-cols-[1fr_auto_1fr]">
          <details className="group lg:hidden">
            <summary
              aria-label="Buka navigasi"
              className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-[var(--radius-control)] border border-border bg-surface text-ink transition-colors duration-[var(--duration-fast)] ease-[var(--ease-blissfy)] hover:border-border-strong hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action-primary)] [&::-webkit-details-marker]:hidden"
            >
              <span
                aria-hidden
                className="flex h-4 w-5 flex-col justify-between"
              >
                <span className="h-px w-full bg-current transition-transform duration-[var(--duration-fast)] group-open:translate-y-[7.5px] group-open:rotate-45" />
                <span className="h-px w-full bg-current transition-opacity duration-[var(--duration-fast)] group-open:opacity-0" />
                <span className="h-px w-full bg-current transition-transform duration-[var(--duration-fast)] group-open:-translate-y-[7.5px] group-open:-rotate-45" />
              </span>
            </summary>

            <div className="absolute inset-x-0 top-full border-b border-border bg-surface shadow-[var(--shadow-menu)]">
              <Container className="py-4">
                <nav
                  aria-label="Navigasi mobile"
                  className="grid gap-1"
                >
                  {navigation.map((item) => (
                    <Link
                      aria-current={activePath === item.href ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center rounded-[var(--radius-control)] px-4 py-3 text-base font-medium text-ink-soft transition-colors duration-[var(--duration-fast)] ease-[var(--ease-blissfy)] hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action-primary)]",
                        activePath === item.href && "font-semibold text-ink",
                      )}
                      href={item.href}
                      key={item.href}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </Container>
            </div>
          </details>

          <Link
            aria-label="Blissfy.co beranda"
            className="shrink-0 text-lg font-semibold leading-none tracking-[-0.01em] text-[var(--color-text-primary)] sm:text-xl"
            href="/"
          >
            blissfy.co
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-[var(--space-4)] text-sm font-normal text-[var(--color-text-secondary)] lg:flex"
          >
            {navigation.map((item) => (
              <Link
                aria-current={activePath === item.href ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 items-center transition-colors duration-[var(--duration-fast)] ease-[var(--ease-blissfy)] after:absolute after:inset-x-0 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-[var(--duration-fast)] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action-primary)]",
                  activePath === item.href &&
                    "font-semibold text-ink after:scale-x-100",
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center justify-self-end">
            <Link
              aria-label="Cari produk"
              className={utilityLinkClasses}
              href="/products"
              style={{ color: "var(--color-text-brand)" }}
            >
              <SearchIcon />
            </Link>

            <Link
              aria-label="Buka keranjang"
              className={utilityLinkClasses}
              href="/cart"
              style={{ color: "var(--color-text-brand)" }}
            >
              <span className="relative inline-flex">
                <BagIcon />
                <CartCountBadge />
              </span>
            </Link>
          </div>
        </Container>
      </header>
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      aria-hidden
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5.75 8.75h12.5l-.75 11H6.5l-.75-11Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M9 9V7a3 3 0 0 1 6 0v2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
