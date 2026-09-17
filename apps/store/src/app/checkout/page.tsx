import type { Metadata } from "next";

import { CheckoutView } from "@/components/store/CheckoutView";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";

export const metadata: Metadata = {
  title: "Checkout | Blissfy.co",
  description:
    "Complete your Blissfy.co order securely with guest checkout.",
};

export default function CheckoutPage() {
  return (
    <>
      <StoreHeader variant="editorial" />
      <main className="bg-bone text-black" id="main-content">
        <div className="container-page pb-[72px] pt-[30px] md:pb-24 md:pt-12 lg:pb-[120px]">
          <CheckoutView />
        </div>
      </main>
      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
