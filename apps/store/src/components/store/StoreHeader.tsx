import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/button";
import { CartCountBadge } from "@/components/store/CartCountBadge";
import { cn } from "@/lib/utils";

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
        <Container className="flex min-h-9 items-center justify-center text-center text-xs font-medium sm:text-sm">
          Belanja fashion Blissfy.co tanpa akun dengan pembayaran dan
          pengiriman yang jelas.
        </Container>
      </div>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-4 lg:h-20">
          <details className="group lg:hidden">
            <summary
              aria-label="Buka navigasi"
              className="flex min-h-11 min-w-11 list-none items-center justify-center rounded-full border border-border bg-surface"
            >
              <span className="flex h-4 w-5 flex-col justify-between" aria-hidden>
                <span className="h-px w-full bg-ink" />
                <span className="h-px w-full bg-ink" />
                <span className="h-px w-full bg-ink" />
              </span>
            </summary>
            <div className="fixed inset-x-0 top-[101px] border-y border-border bg-surface p-4 shadow-[var(--shadow-menu)]">
              <nav aria-label="Navigasi mobile" className="grid gap-2">
                {navigation.map((item) => (
                  <Link
                    className="rounded-[var(--radius-md)] px-4 py-3 text-base font-medium text-ink-soft hover:bg-surface-muted hover:text-ink"
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </details>

          <Link
            aria-label="Blissfy.co beranda"
            className="text-xl font-semibold leading-none text-ink sm:text-2xl"
            href="/"
          >
            Blissfy.co
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-8 text-sm font-medium text-ink-soft lg:flex"
          >
            {navigation.map((item) => (
              <Link className="hover:text-ink" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              className="hidden min-h-11 items-center rounded-full px-4 text-sm font-semibold text-ink-soft hover:bg-surface-muted hover:text-ink sm:inline-flex"
              href="/products"
            >
              Cari
            </Link>
            <Link
              className={cn(
                buttonClasses({ size: "compact", variant: "secondary" }),
                "min-h-11 px-4 max-[359px]:px-1",
              )}
              href="/cart"
            >
              Keranjang
              <CartCountBadge />
            </Link>
          </div>
        </Container>
      </header>
    </>
  );
}
