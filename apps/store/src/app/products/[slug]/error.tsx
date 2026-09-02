"use client";

import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreButton } from "@/components/store/ui/StoreButton";

export default function ProductDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <StoreHeader activePath="/products" variant="editorial" />

      <main className="bg-bone" id="main-content">
        <section className="container-page max-w-[1200px] py-[72px] text-center md:py-24">
          <div className="rounded-[5px] border border-danger/30 bg-paper-white p-8 md:p-12">
          <h1 className="font-goudy-old-style text-[32px] font-normal leading-[1.08] text-danger md:text-[40px]">
            Detail produk belum dapat dimuat
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-danger">
            Data produk belum bisa ditampilkan saat ini. Coba muat ulang halaman
            dalam beberapa saat.
          </p>

          <StoreButton
            className="mt-6 rounded-[5px]"
            onClick={reset}
            variant="secondary"
          >
            Coba lagi
          </StoreButton>
          </div>
        </section>
      </main>

      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
