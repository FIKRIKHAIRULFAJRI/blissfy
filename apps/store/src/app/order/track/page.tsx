import type { Metadata } from "next";
import Link from "next/link";

import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Track Order | Blissfy.co",
  description:
    "Enter your Blissfy.co order number and email address to access order tracking.",
};

const inputClassName =
  "min-h-[56px] w-full rounded-[5px] border border-black/30 bg-paper-white px-4 py-3 text-base text-black outline-none transition-colors placeholder:text-stone hover:border-black/60 focus:border-black focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-black";

export default function TrackOrderPage() {
  return (
    <>
      <StoreHeader activePath="/order/track" variant="editorial" />

      <main className="bg-bone text-black" id="main-content">
        <Container className="py-[72px] sm:py-24 lg:py-[120px]">
          <section
            aria-labelledby="track-order-heading"
            className="mx-auto max-w-[600px] rounded-[5px] border border-black/10 bg-paper-white px-5 py-12 text-center sm:px-12 sm:py-16 lg:px-[72px] lg:py-[80px]"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone">
              Order status
            </p>
            <h1
              className="mt-4 font-goudy-old-style text-[44px] font-normal leading-[0.98] tracking-[-0.02em] sm:text-[56px]"
              id="track-order-heading"
            >
              Track Your
              <br />
              Order
            </h1>
            <p className="mx-auto mt-6 max-w-[440px] text-base leading-[1.6] text-stone sm:text-lg">
              Enter your order number and email address to view the latest
              status of your order.
            </p>

            <form className="mt-12 grid gap-6 text-left sm:mt-14">
              <label className="grid gap-3" htmlFor="tracking-order-number">
                <span className="text-[11px] font-medium uppercase leading-none tracking-[0.1em] text-black">
                  Order number <span aria-hidden>*</span>
                </span>
                <input
                  autoComplete="off"
                  className={inputClassName}
                  id="tracking-order-number"
                  name="orderNumber"
                  placeholder="BLS-20260826-ABC12345"
                  required
                  spellCheck={false}
                  type="text"
                />
              </label>

              <label className="grid gap-3" htmlFor="tracking-email">
                <span className="text-[11px] font-medium uppercase leading-none tracking-[0.1em] text-black">
                  Email address <span aria-hidden>*</span>
                </span>
                <input
                  autoComplete="email"
                  className={inputClassName}
                  id="tracking-email"
                  name="email"
                  placeholder="name@email.com"
                  required
                  type="email"
                />
              </label>

              <button
                aria-describedby="tracking-form-status"
                className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-[5px] border border-[#2C2C2A] bg-[#2C2C2A] px-5 py-3 text-sm font-medium uppercase tracking-[0.08em] text-white transition-colors hover:bg-black focus-visible:outline-black"
                type="button"
              >
                Track Order
              </button>
              <p className="sr-only" id="tracking-form-status">
                Order lookup is not connected yet.
              </p>
            </form>

            <Link
              className="mt-14 inline-flex min-h-11 items-center border-b border-current text-sm text-black transition-colors hover:text-stone focus-visible:outline-black sm:mt-16"
              href="/contact"
            >
              Need help with your order? Contact us
            </Link>
          </section>
        </Container>
      </main>

      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
