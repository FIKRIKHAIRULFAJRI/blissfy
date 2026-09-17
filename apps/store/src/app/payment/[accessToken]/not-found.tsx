import Link from "next/link";

import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { storeButtonClasses } from "@/components/store/ui/StoreButton";

export default function PaymentNotFound() {
  return (
    <>
      <StoreHeader variant="editorial" />
      <main className="bg-bone text-black" id="main-content">
        <div className="container-page py-16 lg:py-20">
          <section className="mx-auto max-w-[460px] rounded-[10px] border border-black/[0.06] bg-paper-white p-8 text-center sm:p-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-error)]">
              Order not found
            </p>
            <h1 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-[-0.025em]">
              Invalid payment link
            </h1>
            <p className="mt-4 text-sm leading-[1.6] text-stone">
              Open the secure payment link provided after completing checkout.
            </p>
            <Link
              className={storeButtonClasses({
                className: "mt-7 !rounded-[5px]",
              })}
              href="/cart"
            >
              Return to Your Bag
            </Link>
          </section>
        </div>
      </main>
      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
