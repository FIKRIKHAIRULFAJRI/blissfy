"use client";

import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreButton } from "@/components/store/ui/StoreButton";

export default function CartError({ reset }: { reset: () => void }) {
  return (
    <>
      <StoreHeader variant="editorial" />

      <main className="bg-bone text-black" id="main-content">
        <div className="container-page pb-[72px] pt-[30px] md:pb-24 md:pt-12 lg:pb-[120px] lg:pt-16">
          <section className="mx-auto max-w-[1200px] rounded-[12px] border border-black/10 bg-paper-white p-8 text-center sm:p-14">
            <h1 className="text-3xl font-semibold leading-tight tracking-[-0.02em] text-black sm:text-4xl">
              Keranjang belum dapat dimuat
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-sm leading-[1.6] text-stone">
              Coba muat ulang halaman. Data harga dan stok akan tetap
              divalidasi ulang sebelum checkout.
            </p>

            <StoreButton
              className="mt-8 rounded-[5px] border border-[#2C2C2A] bg-[#2C2C2A] px-8 uppercase tracking-[0.08em] text-white hover:bg-black focus-visible:outline-black"
              onClick={reset}
              size="large"
            >
              Coba lagi
            </StoreButton>
          </section>
        </div>
      </main>

      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
