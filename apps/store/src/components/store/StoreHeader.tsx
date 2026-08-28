import Link from "next/link";

import { CartCountBadge } from "@/components/store/CartCountBadge";
import { storeButtonClasses } from "@/components/store/ui/StoreButton";
import { Container } from "@/components/ui/Container";

const navigation = [
  { label: "Koleksi", href: "#koleksi" },
  { label: "Produk", href: "/products" },
  { label: "Tentang", href: "/about" },
  { label: "Lacak pesanan", href: "/order/track" },
];

export function StoreHeader() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Lewati ke konten
      </a>

      <div className="bg-ink text-surface">
        <Container className="flex min-h-9 items-center justify-center py-2 text-center text-xs font-medium leading-5">
          Belanja fashion Blissfy.co tanpa akun dengan pembayaran dan
          pengiriman yang jelas.
        </Container>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-2 sm:gap-4 lg:h-20">
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
                      className="flex min-h-11 items-center rounded-[var(--radius-control)] px-4 py-3 text-base font-medium text-ink-soft transition-colors duration-[var(--duration-fast)] ease-[var(--ease-blissfy)] hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action-primary)]"
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
            className="shrink-0 text-xl font-semibold leading-none tracking-[-0.01em] text-ink sm:text-2xl"
            href="/"
          >
            Blissfy.co
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-8 text-sm font-medium text-ink-soft lg:flex"
          >
            {navigation.map((item) => (
              <Link
                className="flex min-h-11 items-center transition-colors duration-[var(--duration-fast)] ease-[var(--ease-blissfy)] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action-primary)]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              aria-label="Cari produk"
              className={storeButtonClasses({
                className: "min-w-11 px-0",
                size: "compact",
                variant: "ghost",
              })}
              href="/products"
            >
              <SearchIcon />
            </Link>

            <Link
              aria-label="Buka keranjang"
              className={storeButtonClasses({
                className: "relative min-w-11 px-0",
                size: "compact",
                variant: "secondary",
              })}
              href="/cart"
            >
              <BagIcon />
              <CartCountBadge />
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
