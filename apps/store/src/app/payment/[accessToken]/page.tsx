import type { Metadata } from "next";

import Link from "next/link";

import { notFound } from "next/navigation";

import { PaymentClient } from "@/components/store/PaymentClient";

import { StoreFooter } from "@/components/store/StoreFooter";

import { Badge } from "@/components/ui/badge";

import { getPaymentOrderByAccessToken } from "@/lib/orders/read";

import { getPaymentStateFromApi } from "@/lib/payments/api";

import { formatRupiah } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pembayaran QRIS | Blissfy.co",

  description:
    "Selesaikan pembayaran QRIS untuk pesanan Blissfy.co.",

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

  const expiresAt =
    new Intl.DateTimeFormat(
      "id-ID",
      {
        dateStyle: "medium",
        timeStyle: "short",

        timeZone:
          "Asia/Jakarta",
      },
    ).format(
      order.expiresAt,
    );

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

          <Badge
            tone={
              payment.paymentStatus ===
              "PAID"
                ? "success"
                : "warning"
            }
          >
            {
              payment.paymentStatus
            }
          </Badge>
        </div>
      </header>

      <main
        className="container-page py-10 md:py-14"
        id="main-content"
      >
        <section className="mx-auto max-w-3xl rounded-[var(--radius-xl)] border border-border bg-surface p-5 md:p-8">
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-olive">
                Pesanan dibuat
              </p>

              <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
                {
                  order.orderNumber
                }
              </h1>

              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Stok ditahan sampai{" "}
                {expiresAt} WIB.
                Gunakan QRIS pada
                halaman ini untuk
                menyelesaikan
                pembayaran.
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] bg-warning-bg p-4 text-sm font-semibold text-warning">
              Status:{" "}
              {
                order.fulfillmentStatus
              }
            </div>
          </div>

          <div className="mt-6">
            <PaymentClient
              accessToken={
                accessToken
              }
              initialPayment={
                payment
              }
            />
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-ink">
                Ringkasan produk
              </h2>

              {order.items.map(
                (item) => (
                  <div
                    className="rounded-[var(--radius-lg)] border border-border p-4 text-sm"
                    key={
                      item.sku
                    }
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink">
                          {
                            item.productName
                          }
                        </p>

                        <p className="mt-1 text-ink-muted">
                          {
                            item.colorName
                          }{" "}
                          /{" "}
                          {
                            item.size
                          }{" "}
                          x{" "}
                          {
                            item.quantity
                          }
                        </p>

                        <p className="mt-1 text-xs font-medium text-ink-muted">
                          SKU{" "}
                          {
                            item.sku
                          }{" "}
                          -{" "}
                          {
                            item.lineWeightGram
                          }{" "}
                          gram
                        </p>

                        {item.discountLabel ? (
                          <p className="mt-2 text-xs font-semibold text-clay">
                            {
                              item.discountLabel
                            }
                          </p>
                        ) : null}
                      </div>

                      <p className="font-semibold text-ink">
                        {formatRupiah(
                          item.lineNet,
                        )}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>

            <aside className="h-fit rounded-[var(--radius-lg)] border border-border bg-surface-muted p-4">
              <h2 className="text-lg font-semibold text-ink">
                Total pembayaran
              </h2>

              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow
                  label="Subtotal kotor"
                  value={formatRupiah(
                    order.grossSubtotal,
                  )}
                />

                <SummaryRow
                  label="Diskon produk"
                  value={`-${formatRupiah(
                    order.discountTotal,
                  )}`}
                />

                <SummaryRow
                  label="Subtotal bersih"
                  value={formatRupiah(
                    order.netSubtotal,
                  )}
                />

                <SummaryRow
                  label="Ongkos kirim"
                  value={formatRupiah(
                    order.shippingCost,
                  )}
                />

                <div className="border-t border-border pt-4">
                  <SummaryRow
                    label="Total"
                    strong
                    value={formatRupiah(
                      order.totalPayment,
                    )}
                  />
                </div>
              </dl>

              <div className="mt-5 rounded-[var(--radius-md)] bg-surface p-3 text-xs leading-5 text-ink-soft">
                {
                  order.courierName
                }{" "}
                -{" "}
                {
                  order.serviceName
                }

                <br />

                Estimasi{" "}
                {order.estimatedDelivery ||
                  "-"}

                <br />

                {
                  order.destinationDistrictName
                }
                ,{" "}
                {
                  order.destinationCityName
                }
              </div>
            </aside>
          </div>
        </section>
      </main>

      <StoreFooter />
    </>
  );
}

function SummaryRow({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div
      className={
        strong
          ? "flex items-center justify-between gap-4 text-base font-semibold text-ink"
          : "flex items-center justify-between gap-4 text-ink-soft"
      }
    >
      <dt>
        {label}
      </dt>

      <dd className="text-right font-semibold text-ink">
        {value}
      </dd>
    </div>
  );
}