"use client";

import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreButton } from "@/components/store/ui/StoreButton";

export default function CheckoutError({ reset }: { reset: () => void }) {
  return (
    <>
      <StoreHeader variant="editorial" />
      <main className="bg-bone text-black" id="main-content">
        <div className="container-page pb-[72px] pt-[30px] md:pb-24 md:pt-12 lg:pb-[120px]">
          <section className="mx-auto max-w-[760px] rounded-[10px] border border-black/10 bg-paper-white p-8 text-center md:p-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone">
              Checkout
            </p>
            <h1 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-black md:text-[38px]">
              Checkout could not be loaded
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-[1.6] text-stone">
              Refresh the checkout and make sure your bag still contains a
              valid selected item.
            </p>
            <StoreButton className="mt-7" onClick={reset} variant="primary">
              Try Again
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
