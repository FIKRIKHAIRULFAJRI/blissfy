"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

import type { PaymentStatus } from "@/lib/payments/status";

import { formatRupiah } from "@/lib/pricing";

import { getPublicApiUrl } from "@/lib/public-api";

type PaymentState = {
  orderNumber: string;

  paymentStatus: PaymentStatus;

  fulfillmentStatus: string;

  amount: number;

  provider: string | null;

  providerOrderId: string | null;

  providerTransactionId?: string | null;

  qrImageUrl: string | null;

  qrString: string | null;

  expiresAt: string;

  paidAt: string | null;

  isPaymentGatewayConfigured?: boolean;
};

type PaymentResponse =
  | {
      ok: true;
      payment: PaymentState;
    }
  | {
      ok: false;
      code?: string;
      message: string;
    };

type PaymentClientProps = {
  accessToken: string;
  initialPayment: PaymentState;
};

const terminalStatuses: PaymentStatus[] = [
  "PAID",
  "EXPIRED",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
  "REQUIRES_REVIEW",
];

export function PaymentClient({
  accessToken,
  initialPayment,
}: PaymentClientProps) {
  const [payment, setPayment] =
    useState(initialPayment);

  const [isCreating, setIsCreating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [now, setNow] =
    useState(() => Date.now());

  const autoChargeAttemptedRef =
    useRef(false);

  const isTerminal =
    terminalStatuses.includes(
      payment.paymentStatus,
    );

  const canCreateQris =
    payment.paymentStatus === "PENDING" &&
    !payment.qrImageUrl &&
    !payment.qrString;

  const remainingSeconds = Math.max(
    0,
    Math.floor(
      (
        new Date(
          payment.expiresAt,
        ).getTime() - now
      ) / 1000,
    ),
  );

  const statusCopy =
    getStatusCopy(
      payment.paymentStatus,
    );

  const countdown = useMemo(() => {
    const minutes =
      Math.floor(
        remainingSeconds / 60,
      );

    const seconds =
      remainingSeconds % 60;

    return `${String(
      minutes,
    ).padStart(
      2,
      "0",
    )}:${String(
      seconds,
    ).padStart(
      2,
      "0",
    )}`;
  }, [remainingSeconds]);

  const createQris =
    useCallback(async () => {
      setIsCreating(true);
      setErrorMessage(null);

      try {
        const response =
          await fetch(
            getPublicApiUrl(
              `/v1/payments/${encodeURIComponent(
                accessToken,
              )}/charge`,
            ),
            {
              method: "POST",
            },
          );

        const body =
          (await response.json()) as PaymentResponse;

        if (
          !response.ok ||
          !body.ok
        ) {
          setErrorMessage(
            body.ok
              ? "QRIS belum dapat dibuat. Coba lagi."
              : body.message,
          );

          return;
        }

        setPayment(
          body.payment,
        );
      } catch {
        setErrorMessage(
          "QRIS belum dapat dibuat. Coba lagi.",
        );
      } finally {
        setIsCreating(false);
      }
    }, [accessToken]);

  const refreshStatus =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            getPublicApiUrl(
              `/v1/payments/${encodeURIComponent(
                accessToken,
              )}/status`,
            ),
            {
              method: "GET",
              cache: "no-store",
            },
          );

        const body =
          (await response.json()) as PaymentResponse;

        if (
          !response.ok ||
          !body.ok
        ) {
          setErrorMessage(
            body.ok
              ? "Status pembayaran belum dapat dicek."
              : body.message,
          );

          return;
        }

        setPayment(
          body.payment,
        );

        setErrorMessage(
          null,
        );
      } catch {
        setErrorMessage(
          "Status pembayaran belum dapat dicek.",
        );
      }
    }, [accessToken]);

  useEffect(() => {
    const interval =
      window.setInterval(
        () =>
          setNow(
            Date.now(),
          ),
        1000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, []);

  useEffect(() => {
    if (
      canCreateQris &&
      !isCreating &&
      !autoChargeAttemptedRef.current
    ) {
      autoChargeAttemptedRef.current =
        true;

      const timeout =
        window.setTimeout(
          () => {
            void createQris();
          },
          0,
        );

      return () =>
        window.clearTimeout(
          timeout,
        );
    }
  }, [
    canCreateQris,
    createQris,
    isCreating,
  ]);

  useEffect(() => {
    if (isTerminal) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          void refreshStatus();
        },
        10_000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, [
    isTerminal,
    refreshStatus,
  ]);

  return (
    <div className="space-y-5">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface-muted p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-olive">
              Status pembayaran
            </p>

            <p className="mt-1 text-xl font-semibold text-ink">
              {statusCopy.title}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase text-ink-muted">
              Total
            </p>

            <p className="mt-1 text-xl font-semibold text-ink">
              {formatRupiah(
                payment.amount,
              )}
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-ink-soft">
          {
            statusCopy.description
          }
        </p>
      </div>

      {payment.paymentStatus ===
      "PENDING" ? (
        <div className="rounded-[var(--radius-lg)] border border-border p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="flex min-h-64 flex-1 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted p-4">
              {payment.qrImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`QRIS pembayaran ${payment.orderNumber}`}
                  className="h-auto max-h-80 w-full max-w-80 object-contain"
                  src={
                    payment.qrImageUrl
                  }
                />
              ) : (
                <div className="max-w-sm text-center text-sm leading-6 text-ink-soft">
                  {isCreating
                    ? "QRIS sedang dibuat."
                    : "QRIS belum tersedia."}
                </div>
              )}
            </div>

            <div className="w-full space-y-4 md:w-56">
              <div className="rounded-[var(--radius-md)] bg-warning-bg p-4">
                <p className="text-xs font-semibold uppercase text-warning">
                  Batas waktu
                </p>

                <p className="mt-2 text-2xl font-semibold text-ink">
                  {countdown}
                </p>
              </div>

              <Button
                className="w-full"
                disabled={
                  isCreating
                }
                onClick={
                  createQris
                }
                variant="secondary"
              >
                {isCreating
                  ? "Memproses..."
                  : payment.qrImageUrl ||
                      payment.qrString
                    ? "Buat ulang QRIS"
                    : "Buat QRIS"}
              </Button>

              <Button
                className="w-full"
                onClick={
                  refreshStatus
                }
                variant="soft"
              >
                Cek status
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {payment.paymentStatus ===
      "PAID" ? (
        <div className="rounded-[var(--radius-lg)] bg-success-bg p-4 text-sm leading-6 text-success">
          Pembayaran berhasil.
          Pesanan masuk ke proses
          pemenuhan.
        </div>
      ) : null}

      {payment.paymentStatus ===
      "REQUIRES_REVIEW" ? (
        <div className="rounded-[var(--radius-lg)] bg-warning-bg p-4 text-sm leading-6 text-warning">
          Pembayaran diterima
          tetapi perlu pemeriksaan
          admin sebelum stok atau
          fulfillment diproses.
        </div>
      ) : null}

      {[
        "EXPIRED",
        "FAILED",
        "CANCELLED",
      ].includes(
        payment.paymentStatus,
      ) ? (
        <div className="rounded-[var(--radius-lg)] bg-danger-bg p-4 text-sm leading-6 text-danger">
          Pembayaran tidak dapat
          dilanjutkan. Silakan buat
          checkout baru jika masih
          ingin membeli produk ini.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[var(--radius-lg)] bg-danger-bg p-4 text-sm leading-6 text-danger">
          <p>
            {errorMessage}
          </p>

          <Button
            className="mt-3"
            onClick={
              payment.qrImageUrl
                ? refreshStatus
                : createQris
            }
            size="compact"
            variant="secondary"
          >
            Coba lagi
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function getStatusCopy(
  status: PaymentStatus,
) {
  switch (status) {
    case "PAID":
      return {
        description:
          "Pembayaran sudah dikonfirmasi oleh payment gateway.",
        title: "Dibayar",
      };

    case "EXPIRED":
      return {
        description:
          "Waktu pembayaran habis dan reservasi stok dilepas.",
        title: "Kedaluwarsa",
      };

    case "FAILED":
      return {
        description:
          "Pembayaran ditolak atau gagal dari payment gateway.",
        title: "Gagal",
      };

    case "CANCELLED":
      return {
        description:
          "Pembayaran dibatalkan.",
        title: "Dibatalkan",
      };

    case "REQUIRES_REVIEW":
      return {
        description:
          "Status pembayaran perlu dicek admin sebelum diproses.",
        title: "Perlu review",
      };

    case "REFUNDED":
      return {
        description:
          "Pembayaran sudah direfund.",
        title: "Refund",
      };

    default:
      return {
        description:
          "Scan QRIS dan selesaikan pembayaran sebelum waktu habis.",
        title:
          "Menunggu pembayaran",
      };
  }
}