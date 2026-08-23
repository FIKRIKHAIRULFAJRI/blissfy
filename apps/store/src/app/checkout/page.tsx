import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutView } from "@/components/store/CheckoutView";
import { StoreFooter } from "@/components/store/StoreFooter";

export const metadata: Metadata = {
  title: "Checkout | Blissfy.co",
  description:
    "Isi data penerima dan alamat pengiriman untuk fondasi guest checkout Blissfy.co.",
};

export default function CheckoutPage() {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="container-page flex min-h-16 items-center justify-between gap-4">
          <Link
            aria-label="Blissfy.co beranda"
            className="text-xl font-semibold leading-none text-ink sm:text-2xl"
            href="/"
          >
            Blissfy.co
          </Link>
          <div className="flex items-center gap-3 text-sm font-semibold text-ink-soft">
            <span aria-hidden>Lock</span>
            Checkout aman
          </div>
        </div>
      </header>
      <main className="container-page py-10 md:py-14" id="main-content">
        <CheckoutView />
      </main>
      <StoreFooter />
    </>
  );
}
