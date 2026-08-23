import "server-only";

import type { PoolClient } from "pg";
import { db } from "@/lib/db";
import {
  chargeQris,
  getQrisImageUrl,
  sanitizeMidtransPayload,
  type MidtransChargeResponse,
} from "@/lib/midtrans/client";
import { MidtransConfigError, isMidtransConfigured } from "@/lib/midtrans/config";
import { hashSecret } from "@/lib/orders/hash";
import type { PaymentStatus } from "@/lib/payments/status";

type PaymentAccessRow = {
  orderId: string;
  orderNumber: string;
  accessTokenHash: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: string;
  totalPayment: number;
  expiresAt: Date;
  recipientName: string;
  email: string;
  whatsapp: string;
  paymentId: string;
  paymentProvider: string | null;
  providerOrderId: string | null;
  paymentGatewayTransactionId: string | null;
  paymentType: string | null;
  paymentStatusRow: PaymentStatus;
  amount: number;
  grossAmount: number | null;
  qrImageUrl: string | null;
  qrString: string | null;
  paidAt: Date | null;
  paymentExpiresAt: Date;
};

export type PublicPaymentState = {
  orderNumber: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: string;
  amount: number;
  provider: string | null;
  providerOrderId: string | null;
  qrImageUrl: string | null;
  qrString: string | null;
  expiresAt: string;
  paidAt: string | null;
  isMidtransConfigured: boolean;
};

export async function createOrGetQrisPayment(accessToken: string) {
  const tokenHash = hashSecret(accessToken);
  const order = await getPaymentAccessRow(tokenHash);

  if (!order) {
    throw new PaymentServiceError(
      "ORDER_NOT_FOUND",
      "Link pembayaran tidak ditemukan.",
      404,
    );
  }

  if (!isMidtransConfigured()) {
    throw new PaymentServiceError(
      "MIDTRANS_NOT_CONFIGURED",
      "Konfigurasi Midtrans belum tersedia di server.",
      503,
    );
  }

  if (order.paymentStatus !== "PENDING" || order.paymentStatusRow !== "PENDING") {
    return toPublicPaymentState(order);
  }

  if (order.expiresAt <= new Date() || order.paymentExpiresAt <= new Date()) {
    await markOrderExpired(order.orderId, order.paymentId);
    return {
      ...toPublicPaymentState(order),
      paymentStatus: "EXPIRED" as const,
      fulfillmentStatus: "CANCELLED",
    };
  }

  if (order.providerOrderId && (order.qrImageUrl || order.qrString)) {
    return toPublicPaymentState(order);
  }

  const expiryMinutes = Math.max(
    1,
    Math.ceil((order.paymentExpiresAt.getTime() - Date.now()) / 60000),
  );

  try {
    const charge = await chargeQris({
      customer: {
        email: order.email,
        firstName: order.recipientName,
        phone: order.whatsapp,
      },
      expiryMinutes,
      grossAmount: order.amount,
      orderId: order.orderNumber,
    });

    await updatePaymentFromCharge(order.paymentId, order.orderNumber, charge);

    return {
      ...toPublicPaymentState(order),
      provider: "midtrans",
      providerOrderId: order.orderNumber,
      qrImageUrl: getQrisImageUrl(charge) ?? order.qrImageUrl,
      qrString:
        typeof charge.qr_string === "string" ? charge.qr_string : order.qrString,
    };
  } catch (error) {
    if (error instanceof MidtransConfigError) {
      throw new PaymentServiceError(
        error.code,
        "Konfigurasi Midtrans belum tersedia di server.",
        503,
      );
    }

    throw error;
  }
}

export async function getPublicPaymentStateByToken(accessToken: string) {
  const order = await getPaymentAccessRow(hashSecret(accessToken));

  if (!order) {
    return null;
  }

  if (
    order.paymentStatus === "PENDING" &&
    order.paymentStatusRow === "PENDING" &&
    (order.expiresAt <= new Date() || order.paymentExpiresAt <= new Date())
  ) {
    await markOrderExpired(order.orderId, order.paymentId);

    return {
      ...toPublicPaymentState(order),
      paymentStatus: "EXPIRED" as const,
      fulfillmentStatus: "CANCELLED",
    };
  }

  return toPublicPaymentState(order);
}

async function getPaymentAccessRow(accessTokenHash: string) {
  const result = await db.query<PaymentAccessRow>(
    `
      SELECT
        o.id AS "orderId",
        o."orderNumber",
        o."accessTokenHash",
        o."paymentStatus"::text AS "paymentStatus",
        o."fulfillmentStatus"::text AS "fulfillmentStatus",
        o."totalPayment",
        o."expiresAt",
        o."recipientName",
        o.email,
        o.whatsapp,
        p.id AS "paymentId",
        p.provider AS "paymentProvider",
        p."providerOrderId",
        p."gatewayTransactionId" AS "paymentGatewayTransactionId",
        p."paymentType",
        p.status::text AS "paymentStatusRow",
        p.amount,
        p."grossAmount",
        p."qrImageUrl",
        p."qrString",
        p."paidAt",
        p."expiresAt" AS "paymentExpiresAt"
      FROM orders o
      INNER JOIN payments p ON p."orderId" = o.id
      WHERE o."accessTokenHash" = $1
      LIMIT 1
    `,
    [accessTokenHash],
  );

  return result.rows[0] ?? null;
}

async function updatePaymentFromCharge(
  paymentId: string,
  providerOrderId: string,
  charge: MidtransChargeResponse,
) {
  const grossAmount =
    typeof charge.gross_amount === "string"
      ? Math.round(Number(charge.gross_amount))
      : null;

  await db.query(
    `
      UPDATE payments
      SET
        provider = 'midtrans',
        "providerOrderId" = $2,
        "gatewayTransactionId" = COALESCE($3, "gatewayTransactionId"),
        "paymentType" = COALESCE($4, "paymentType"),
        "grossAmount" = COALESCE($5, "grossAmount"),
        "qrImageUrl" = COALESCE($6, "qrImageUrl"),
        "qrString" = COALESCE($7, "qrString"),
        "lastStatusCode" = $8,
        "lastStatusMessage" = $9,
        "fraudStatus" = $10,
        "rawResponse" = $11::jsonb
      WHERE id = $1
    `,
    [
      paymentId,
      providerOrderId,
      typeof charge.transaction_id === "string" ? charge.transaction_id : null,
      typeof charge.payment_type === "string" ? charge.payment_type : "qris",
      Number.isFinite(grossAmount) ? grossAmount : null,
      getQrisImageUrl(charge) ?? null,
      typeof charge.qr_string === "string" ? charge.qr_string : null,
      typeof charge.status_code === "string" ? charge.status_code : null,
      typeof charge.status_message === "string" ? charge.status_message : null,
      typeof charge.fraud_status === "string" ? charge.fraud_status : null,
      JSON.stringify(sanitizeMidtransPayload(charge)),
    ],
  );
}

async function markOrderExpired(orderId: string, paymentId: string) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `
        UPDATE payments
        SET status = 'EXPIRED'
        WHERE id = $1
          AND status = 'PENDING'
      `,
      [paymentId],
    );
    await client.query(
      `
        UPDATE orders
        SET
          "paymentStatus" = 'EXPIRED',
          "fulfillmentStatus" = 'CANCELLED'
        WHERE id = $1
          AND "paymentStatus" = 'PENDING'
      `,
      [orderId],
    );
    await releaseActiveReservations(client, orderId, "EXPIRED");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function releaseActiveReservations(
  client: PoolClient,
  orderId: string,
  nextStatus: "EXPIRED" | "RELEASED",
) {
  const reservationResult = await client.query<{
    id: string;
    variantId: string;
    quantity: number;
  }>(
    `
      UPDATE stock_reservations
      SET
        status = $2::"StockReservationStatus",
        "releasedAt" = COALESCE("releasedAt", NOW())
      WHERE "orderId" = $1
        AND status = 'ACTIVE'
      RETURNING id, "variantId", quantity
    `,
    [orderId, nextStatus],
  );

  if (reservationResult.rows.length === 0) {
    return;
  }

  await client.query(
    `
      INSERT INTO inventory_movements (
        "variantId",
        "orderId",
        "reservationId",
        type,
        "quantityDelta",
        note
      )
      SELECT
        item."variantId",
        $1,
        item."reservationId",
        'RESERVATION_RELEASED',
        item.quantity,
        'Reservasi stok checkout kedaluwarsa'
      FROM jsonb_to_recordset($2::jsonb) AS item(
        "variantId" text,
        "reservationId" text,
        quantity int
      )
    `,
    [
      orderId,
      JSON.stringify(
        reservationResult.rows.map((reservation) => ({
          variantId: reservation.variantId,
          reservationId: reservation.id,
          quantity: reservation.quantity,
        })),
      ),
    ],
  );
}

function toPublicPaymentState(row: PaymentAccessRow): PublicPaymentState {
  return {
    amount: row.amount,
    expiresAt: row.paymentExpiresAt.toISOString(),
    fulfillmentStatus: row.fulfillmentStatus,
    isMidtransConfigured: isMidtransConfigured(),
    orderNumber: row.orderNumber,
    paidAt: row.paidAt?.toISOString() ?? null,
    paymentStatus:
      row.paymentStatus === row.paymentStatusRow
        ? row.paymentStatus
        : row.paymentStatusRow,
    provider: row.paymentProvider,
    providerOrderId: row.providerOrderId,
    qrImageUrl: row.qrImageUrl,
    qrString: row.qrString,
  };
}

export class PaymentServiceError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "PaymentServiceError";
    this.code = code;
    this.status = status;
  }
}
