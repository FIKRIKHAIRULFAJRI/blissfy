import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaymentClient } from "@/components/store/PaymentClient";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { getPaymentOrderByAccessToken } from "@/lib/orders/read";
import { getPaymentStateFromApi } from "@/lib/payments/api";

export const metadata: Metadata = {
  title: "QRIS Payment | Blissfy.co",

  description:
    "Complete your Blissfy.co order securely with QRIS.",

  robots: {
    index: false,
    follow: false,
  },
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{
    accessToken: string;
  }>;
}) {
  const {
    accessToken,
  } = await params;

  const [
    order,
    payment,
  ] = await Promise.all([
    getPaymentOrderByAccessToken(
      accessToken,
    ),

    getPaymentStateFromApi(
      accessToken,
    ),
  ]);

  if (
    !order ||
    !payment
  ) {
    notFound();
  }

  return (
    <>
      <StoreHeader variant="editorial" />
      <main className="bg-bone text-black" id="main-content">
        <div className="container-page py-12 sm:py-16 lg:py-20">
          <section className="mx-auto max-w-[460px] rounded-[10px] border border-black/[0.06] bg-paper-white px-5 py-8 sm:px-9 sm:py-10">
            <PaymentClient
              accessToken={accessToken}
              initialPayment={payment}
            />
          </section>
        </div>
      </main>
      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}
