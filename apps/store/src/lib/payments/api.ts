import "server-only";

import { getApiUrl } from "@/lib/api";

import type { PaymentStatus } from "./status";

export type PublicPaymentState = {
  orderNumber: string;

  paymentStatus: PaymentStatus;

  fulfillmentStatus: string;

  amount: number;

  provider: string | null;

  providerOrderId: string | null;

  providerTransactionId: string | null;

  qrImageUrl: string | null;

  qrString: string | null;

  expiresAt: string;

  paidAt: string | null;

  isPaymentGatewayConfigured: boolean;
};

type PaymentApiResponse =
  | {
      ok: true;
      payment: PublicPaymentState;
    }
  | {
      ok: false;
      code?: string;
      message: string;
    };

export async function getPaymentStateFromApi(
  accessToken: string,
): Promise<PublicPaymentState | null> {
  const response = await fetch(
    getApiUrl(
      `/v1/payments/${encodeURIComponent(
        accessToken,
      )}/status`,
    ),
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  const body =
    (await response.json()) as PaymentApiResponse;

  if (!response.ok || !body.ok) {
    throw new Error(
      body.ok
        ? "Payment API request failed."
        : body.message,
    );
  }

  return body.payment;
}