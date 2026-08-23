"use client";

import Link from "next/link";
import { StoreFooter } from "@/components/store/StoreFooter";
import { Button } from "@/components/ui/button";

export default function CheckoutError({ reset }: { reset: () => void }) {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="container-page flex min-h-16 items-center justify-between gap-4">
          <Link className="text-xl font-semibold text-ink" href="/">
            Blissfy.co
          </Link>
          <span className="text-sm font-semibold text-ink-soft">
            Checkout aman
          </span>
        </div>
      </header>
      <main className="container-page py-10 md:py-14" id="main-content">
        <section className="rounded-[var(--radius-xl)] border border-danger/30 bg-danger-bg p-8 text-center md:p-12">
          <h1 className="text-2xl font-semibold text-danger">
            Checkout belum dapat dimuat
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-danger">
            Muat ulang halaman dan pastikan keranjang masih berisi item valid.
          </p>
          <Button className="mt-6" onClick={reset} variant="secondary">
            Coba lagi
          </Button>
        </section>
      </main>
      <StoreFooter />
    </>
  );
}
