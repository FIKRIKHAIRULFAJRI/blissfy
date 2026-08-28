"use client";

import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreButton } from "@/components/store/ui/StoreButton";

export default function CartError({ reset }: { reset: () => void }) {
  return (
    <>
      <StoreHeader />

      <main className="container-page py-10 md:py-14" id="main-content">
        <section className="rounded-[var(--radius-xl)] border border-danger/30 bg-danger-bg p-8 text-center md:p-12">
          <h1 className="text-2xl font-semibold text-danger">
            Keranjang belum dapat dimuat
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-danger">
            Coba muat ulang halaman. Data harga dan stok akan tetap divalidasi
            ulang sebelum checkout.
          </p>

          <StoreButton
            className="mt-6"
            onClick={reset}
            variant="secondary"
          >
            Coba lagi
          </StoreButton>
        </section>
      </main>

      <StoreFooter />
    </>
  );
}
