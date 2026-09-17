"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { StoreButton } from "@/components/store/ui/StoreButton";
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

  const [isRefreshing, setIsRefreshing] =
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
      setIsRefreshing(true);

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
      } finally {
        setIsRefreshing(false);
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
    <div className="text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-stone">
        Order #{payment.orderNumber}
      </p>

      {payment.paymentStatus === "PENDING" ? (
        <>
          <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-stone">
            Payment expires in
          </p>
          <p className="mt-1 text-[48px] font-semibold leading-none tracking-[-0.04em] text-black sm:text-[56px]">
            {countdown}
          </p>
        </>
      ) : null}

      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-black">
        <span
          aria-hidden="true"
          className={getStatusDotClasses(payment.paymentStatus)}
        />
        <span>{statusCopy.title}</span>
      </div>

      <div className="mt-7">
        <p className="text-[11px] font-medium tracking-[0.04em] text-stone">
          Total Payment
        </p>
        <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em] text-black">
          {formatRupiah(payment.amount)}
        </p>
      </div>

      {payment.paymentStatus === "PENDING" ? (
        <>
          <section className="mt-9 rounded-[6px] border border-black/15 bg-paper-white p-5 sm:p-7">
            <h1 className="text-xs font-semibold uppercase tracking-[0.14em] text-black">
              Scan to pay with QRIS
            </h1>

            <div className="mx-auto mt-7 flex min-h-[220px] max-w-[320px] items-center justify-center bg-[#F5F8FA] p-5">
              {payment.qrImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`QRIS payment ${payment.orderNumber}`}
                  className="h-auto max-h-[200px] w-full max-w-[200px] object-contain"
                  src={payment.qrImageUrl}
                />
              ) : (
                <p className="text-sm leading-6 text-stone">
                  {isCreating
                    ? "Preparing your QRIS code..."
                    : "QRIS is not available yet."}
                </p>
              )}
            </div>

            <p className="mx-auto mt-7 max-w-[310px] text-xs leading-[1.5] text-stone">
              Use any banking or e-wallet app that supports QRIS.
            </p>

            {!payment.qrImageUrl && !isCreating ? (
              <StoreButton
                className="mt-5 w-full !rounded-[5px]"
                onClick={createQris}
                variant="secondary"
              >
                Generate QRIS
              </StoreButton>
            ) : null}
          </section>

          <section className="mt-7 rounded-[6px] border border-black/15 bg-paper-white p-6 text-left sm:p-7">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-black">
              How to Pay
            </h2>
            <ol className="mt-5 space-y-3 text-sm leading-[1.55] text-stone">
              <li>1. Open your preferred banking or e-wallet app.</li>
              <li>2. Select Scan QR / QRIS.</li>
              <li>3. Scan the QR code above.</li>
              <li>4. Confirm the payment amount.</li>
              <li>5. Complete the payment in your app.</li>
            </ol>
            <p className="mt-5 text-xs italic leading-[1.5] text-stone">
              We&apos;ll automatically update your payment status once your
              payment is confirmed.
            </p>
          </section>

          <StoreButton
            className="mt-7 w-full !rounded-[5px] uppercase tracking-[0.1em]"
            disabled={isRefreshing}
            onClick={refreshStatus}
            size="large"
          >
            {isRefreshing ? "Checking..." : "Check Payment Status"}
          </StoreButton>
        </>
      ) : (
        <div className={getTerminalPanelClasses(payment.paymentStatus)}>
          <p className="font-medium">{statusCopy.description}</p>
        </div>
      )}

      {errorMessage ? (
        <div className="mt-5 rounded-[5px] border border-black/10 bg-paper-white p-4 text-left text-sm leading-6 text-[var(--color-error)]">
          <p>{errorMessage}</p>
          <StoreButton
            className="mt-3 !rounded-[5px]"
            onClick={payment.qrImageUrl ? refreshStatus : createQris}
            size="compact"
            variant="secondary"
          >
            Try Again
          </StoreButton>
        </div>
      ) : null}
    </div>
  );
}

function getStatusDotClasses(status: PaymentStatus) {
  if (status === "PAID") {
    return "size-2 rounded-full bg-[var(--color-success)]";
  }

  if (["FAILED", "CANCELLED", "EXPIRED"].includes(status)) {
    return "size-2 rounded-full bg-[var(--color-error)]";
  }

  return "size-2 rounded-full bg-[#8299A5]";
}

function getTerminalPanelClasses(status: PaymentStatus) {
  if (status === "PAID") {
    return "mt-8 rounded-[5px] bg-success-bg p-5 text-sm leading-6 text-success";
  }

  if (status === "REQUIRES_REVIEW") {
    return "mt-8 rounded-[5px] bg-warning-bg p-5 text-sm leading-6 text-warning";
  }

  return "mt-8 rounded-[5px] bg-danger-bg p-5 text-sm leading-6 text-danger";
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
