import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAdmin } from "@/app/admin/auth-actions";
import { buttonClasses } from "@/components/ui/button";
import type { AdminSession } from "@/lib/admin/auth";

const navItems = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/products", label: "Produk" },
  { href: "/admin/categories", label: "Kategori" },
];

export function AdminShell({
  children,
  session,
}: {
  children: ReactNode;
  session: AdminSession;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-border bg-surface px-4 py-5 lg:border-b-0 lg:border-r lg:px-5">
          <div className="flex flex-wrap items-center justify-between gap-4 lg:block">
            <Link
              className="text-xl font-semibold leading-none text-ink"
              href="/admin"
            >
              Blissfy.co
            </Link>
            <p className="mt-0 text-xs font-semibold uppercase text-ink-muted lg:mt-2">
              Admin katalog
            </p>
          </div>

          <nav
            aria-label="Navigasi admin"
            className="mt-5 flex gap-2 overflow-x-auto lg:flex-col"
          >
            {navItems.map((item) => (
              <Link
                className="whitespace-nowrap rounded-[var(--radius-sm)] px-4 py-3 text-sm font-semibold text-ink-soft hover:bg-canvas hover:text-ink"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 rounded-[var(--radius-md)] border border-border bg-canvas p-4">
            <p className="text-xs font-semibold uppercase text-ink-muted">
              Masuk sebagai
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-ink">
              {session.admin.displayName ?? session.admin.email}
            </p>
            <form action={logoutAdmin} className="mt-4">
              <button
                className={buttonClasses({
                  className: "w-full rounded-[var(--radius-sm)]",
                  size: "compact",
                  variant: "secondary",
                })}
                type="submit"
              >
                Keluar
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0">
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
