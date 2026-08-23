import { createHash } from "node:crypto";
import type { PaymentStatus } from "@/lib/payments/status";

export type MidtransNotificationPayload = Record<string, unknown> & {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
  status_message?: string;
  settlement_time?: string;
};

export type MappedMidtransStatus = {
  paymentStatus: PaymentStatus;
  shouldFinalizeSale: boolean;
  shouldReleaseReservation: boolean;
  processingResult: string;
};

export function getMidtransSignature({
  grossAmount,
  orderId,
  serverKey,
  statusCode,
}: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  serverKey: string;
}) {
  return createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
}

export function mapMidtransStatus({
  fraudStatus,
  transactionStatus,
}: {
  transactionStatus: string;
  fraudStatus?: string;
}): MappedMidtransStatus {
  const normalized = transactionStatus.toLowerCase();
  const normalizedFraud = fraudStatus?.toLowerCase();

  if (
    normalized === "settlement" ||
    (normalized === "capture" && normalizedFraud === "accept")
  ) {
    return {
      paymentStatus: "PAID",
      shouldFinalizeSale: true,
      shouldReleaseReservation: false,
      processingResult: "SALE_FINALIZED",
    };
  }

  if (normalized === "expire") {
    return {
      paymentStatus: "EXPIRED",
      shouldFinalizeSale: false,
      shouldReleaseReservation: true,
      processingResult: "PAYMENT_EXPIRED",
    };
  }

  if (normalized === "cancel") {
    return {
      paymentStatus: "CANCELLED",
      shouldFinalizeSale: false,
      shouldReleaseReservation: true,
      processingResult: "PAYMENT_CANCELLED",
    };
  }

  if (normalized === "deny" || normalized === "failure") {
    return {
      paymentStatus: "FAILED",
      shouldFinalizeSale: false,
      shouldReleaseReservation: true,
      processingResult: "PAYMENT_FAILED",
    };
  }

  return {
    paymentStatus: "PENDING",
    shouldFinalizeSale: false,
    shouldReleaseReservation: false,
    processingResult: "PAYMENT_PENDING",
  };
}

export function parseGrossAmount(value: string) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }

  return Math.round(numberValue);
}

export function getMidtransEventHash(payload: MidtransNotificationPayload) {
  return createHash("sha256")
    .update(
      [
        "midtrans",
        payload.order_id,
        payload.transaction_id ?? "",
        payload.transaction_status,
        payload.status_code,
        payload.gross_amount,
      ].join("|"),
    )
    .digest("hex");
}
