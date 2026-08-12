import Link from "next/link";

const footerLinks = [
  { label: "Kontak", href: "/contact" },
  { label: "Kebijakan pengiriman", href: "/shipping-policy" },
  { label: "Kebijakan privasi", href: "/privacy-policy" },
  { label: "Syarat pembelian", href: "/terms" },
];

export function StoreFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-10 md:grid-cols-[1.2fr_0.8fr] md:py-14">
        <div>
          <Link className="text-2xl font-semibold leading-none" href="/">
            Blissfy.co
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-ink-soft">
            Toko fashion single-store dengan pengalaman belanja sederhana,
            jelas, dan terpercaya.
          </p>
        </div>
        <nav
          aria-label="Tautan footer"
          className="grid gap-3 text-sm font-medium text-ink-soft sm:grid-cols-2"
        >
          {footerLinks.map((link) => (
            <Link className="hover:text-ink" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
