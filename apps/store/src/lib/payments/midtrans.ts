import "server-only";

import { timingSafeEqual } from "node:crypto";
import type { PoolClient } from "pg";
import { db } from "@/lib/db";
import { getMidtransConfig } from "@/lib/midtrans/config";
import { getTransactionStatus, sanitizeMidtransPayload } from "@/lib/midtrans/client";
import type { PaymentStatus } from "@/lib/payments/status";
import {
  getMidtransEventHash,
  getMidtransSignature,
  mapMidtransStatus,
  parseGrossAmount,
  type MappedMidtransStatus,
  type MidtransNotificationPayload,
} from "@/lib/payments/midtrans-contract";

export {
  getMidtransEventHash,
  getMidtransSignature,
  mapMidtransStatus,
  parseGrossAmount,
};

export function verifyMidtransSignature(payload: MidtransNotificationPayload) {
  const config = getMidtransConfig();
  const expected = getMidtransSignature({
    grossAmount: payload.gross_amount,
    orderId: payload.order_id,
    serverKey: config.serverKey,
    statusCode: payload.status_code,
  });

  return safeEqualHex(expected, payload.signature_key);
}

export async function reconcilePendingMidtransPayments() {
  const result = await db.query<{
    providerOrderId: string;
  }>(
    `
      SELECT "providerOrderId"
      FROM payments
      WHERE provider = 'midtrans'
        AND status = 'PENDING'
        AND "providerOrderId" IS NOT NULL
      ORDER BY "expiresAt" ASC
      LIMIT 25
    `,
  );
  const outcomes = [];

  for (const payment of result.rows) {
    const status = await getTransactionStatus(payment.providerOrderId);
    const notification = normalizeStatusResponse(status);
    const outcome = await processMidtransNotification(notification, {
      verifySignature: false,
      source: "reconcile",
    });

    outcomes.push(outcome);
  }

  return outcomes;
}

export async function processMidtransNotification(
  payload: MidtransNotificationPayload,
  options: { verifySignature: boolean; source: "webhook" | "reconcile" },
) {
  if (options.verifySignature && !verifyMidtransSignature(payload)) {
    throw new MidtransNotificationError(
      "INVALID_SIGNATURE",
      "Notifikasi pembayaran tidak valid.",
      401,
    );
  }

  const grossAmount = parseGrossAmount(payload.gross_amount);

  if (grossAmount === null) {
    throw new MidtransNotificationError(
      "INVALID_GROSS_AMOUNT",
      "Nominal pembayaran tidak valid.",
      400,
    );
  }

  const eventHash = getMidtransEventHash(payload);
  const mapped = mapMidtransStatus({
    fraudStatus: payload.fraud_status,
    transactionStatus: payload.transaction_status,
  });
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      payload.order_id,
    ]);

    const existingEvent = await client.query<{ id: string; processingResult: string | null }>(
      `
        SELECT id, "processingResult"
        FROM payment_events
        WHERE "eventHash" = $1
        LIMIT 1
      `,
      [eventHash],
    );

    if (existingEvent.rows[0]?.processingResult) {
      await client.query("COMMIT");

      return {
        ok: true,
        duplicate: true,
        result: existingEvent.rows[0].processingResult,
      };
    }

    const payment = await getPaymentForUpdate(client, payload.order_id);

    if (!payment) {
      await insertPaymentEvent(client, payload, {
        eventHash,
        grossAmount,
        processingResult: "PAYMENT_NOT_FOUND",
      });
      await client.query("COMMIT");

      return {
        ok: true,
        duplicate: false,
        result: "PAYMENT_NOT_FOUND",
      };
    }

    const eventId = await insertPaymentEvent(client, payload, {
      eventHash,
      grossAmount,
      orderId: payment.orderId,
      paymentId: payment.id,
      processingResult: null,
    });

    if (grossAmount !== payment.amount) {
      await markPaymentRequiresReview(client, payment, payload, grossAmount);
      await markPaymentEventProcessed(client, eventId, "AMOUNT_MISMATCH");
      await client.query("COMMIT");

      return {
        ok: true,
        duplicate: false,
        result: "AMOUNT_MISMATCH",
      };
    }

    const result = await applyMappedStatus(client, payment, payload, mapped);
    await markPaymentEventProcessed(client, eventId, result);
    await client.query("COMMIT");

    return {
      ok: true,
      duplicate: false,
      result,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function normalizeStatusResponse(
  status: Record<string, unknown>,
): MidtransNotificationPayload {
  return {
    ...status,
    fraud_status:
      typeof status.fraud_status === "string" ? status.fraud_status : undefined,
    gross_amount: String(status.gross_amount ?? ""),
    order_id: String(status.order_id ?? ""),
    signature_key: "",
    status_code: String(status.status_code ?? ""),
    transaction_status: String(status.transaction_status ?? ""),
  };
}

function safeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

type PaymentForUpdate = {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  status: PaymentStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: string;
};

async function getPaymentForUpdate(client: PoolClient, providerOrderId: string) {
  const result = await client.query<PaymentForUpdate>(
    `
      SELECT
        p.id,
        p."orderId",
        o."orderNumber",
        p.amount,
        p.status::text AS status,
        o."paymentStatus"::text AS "paymentStatus",
        o."fulfillmentStatus"::text AS "fulfillmentStatus"
      FROM payments p
      INNER JOIN orders o ON o.id = p."orderId"
      WHERE p."providerOrderId" = $1
         OR o."orderNumber" = $1
      ORDER BY p."createdAt" DESC
      LIMIT 1
      FOR UPDATE OF p, o
    `,
    [providerOrderId],
  );

  return result.rows[0] ?? null;
}

async function insertPaymentEvent(
  client: PoolClient,
  payload: MidtransNotificationPayload,
  input: {
    eventHash: string;
    grossAmount: number;
    orderId?: string;
    paymentId?: string;
    processingResult: string | null;
  },
) {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO payment_events (
        "paymentId",
        "orderId",
        provider,
        "eventHash",
        "eventType",
        "providerOrderId",
        "gatewayTransactionId",
        "transactionStatus",
        "fraudStatus",
        "statusCode",
        "grossAmount",
        payload,
        "processingResult",
        "processedAt"
      )
      VALUES (
        $1, $2, 'midtrans', $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12,
        CASE WHEN $12::text IS NULL THEN NULL ELSE NOW() END
      )
      ON CONFLICT ("eventHash") DO UPDATE
      SET "createdAt" = payment_events."createdAt"
      RETURNING id
    `,
    [
      input.paymentId ?? null,
      input.orderId ?? null,
      input.eventHash,
      payload.transaction_status,
      payload.order_id,
      payload.transaction_id ?? null,
      payload.transaction_status,
      payload.fraud_status ?? null,
      payload.status_code,
      input.grossAmount,
      JSON.stringify(sanitizeMidtransPayload(payload)),
      input.processingResult,
    ],
  );

  return result.rows[0].id;
}

async function markPaymentEventProcessed(
  client: PoolClient,
  eventId: string,
  processingResult: string,
) {
  await client.query(
    `
      UPDATE payment_events
      SET
        "processingResult" = $2,
        "processedAt" = NOW()
      WHERE id = $1
    `,
    [eventId, processingResult],
  );
}

async function markPaymentRequiresReview(
  client: PoolClient,
  payment: PaymentForUpdate,
  payload: MidtransNotificationPayload,
  grossAmount: number,
) {
  await client.query(
    `
      UPDATE payments
      SET
        status = 'REQUIRES_REVIEW',
        "grossAmount" = $2,
        "gatewayTransactionId" = COALESCE($3, "gatewayTransactionId"),
        "paymentType" = COALESCE($4, "paymentType"),
        "lastStatusCode" = $5,
        "lastStatusMessage" = $6,
        "fraudStatus" = $7,
        "rawResponse" = $8::jsonb
      WHERE id = $1
    `,
    [
      payment.id,
      grossAmount,
      payload.transaction_id ?? null,
      payload.payment_type ?? null,
      payload.status_code,
      payload.status_message ?? null,
      payload.fraud_status ?? null,
      JSON.stringify(sanitizeMidtransPayload(payload)),
    ],
  );
  await client.query(
    `
      UPDATE orders
      SET "paymentStatus" = 'REQUIRES_REVIEW'
      WHERE id = $1
    `,
    [payment.orderId],
  );
}

async function applyMappedStatus(
  client: PoolClient,
  payment: PaymentForUpdate,
  payload: MidtransNotificationPayload,
  mapped: MappedMidtransStatus,
) {
  if (payment.status === "PAID" || payment.paymentStatus === "PAID") {
    await updatePaymentGatewayFields(client, payment.id, payload, payment.status);
    return "ALREADY_PAID";
  }

  if (mapped.shouldFinalizeSale) {
    return finalizePaidOrder(client, payment, payload);
  }

  if (mapped.shouldReleaseReservation) {
    await releaseReservations(client, payment.orderId, mapped.paymentStatus);
    await updatePaymentAndOrderStatus(client, payment, payload, mapped.paymentStatus);

    return mapped.processingResult;
  }

  await updatePaymentGatewayFields(client, payment.id, payload, "PENDING");

  return mapped.processingResult;
}

async function finalizePaidOrder(
  client: PoolClient,
  payment: PaymentForUpdate,
  payload: MidtransNotificationPayload,
) {
  const reservationResult = await client.query<{
    id: string;
    status: string;
    variantId: string;
    quantity: number;
    expiresAt: Date;
  }>(
    `
      SELECT id, status::text AS status, "variantId", quantity, "expiresAt"
      FROM stock_reservations
      WHERE "orderId" = $1
      ORDER BY "variantId"
      FOR UPDATE
    `,
    [payment.orderId],
  );
  const reservations = reservationResult.rows;
  const now = new Date();
  const allActive =
    reservations.length > 0 &&
    reservations.every(
      (reservation) =>
        reservation.status === "ACTIVE" &&
        reservation.expiresAt > now &&
        typeof reservation.variantId === "string",
    );

  if (!allActive) {
    await markPaymentRequiresReview(
      client,
      payment,
      payload,
      parseGrossAmount(payload.gross_amount) ?? payment.amount,
    );

    return "RESERVATION_NOT_ACTIVE_REVIEW_REQUIRED";
  }

  const stockResult = await client.query<{
    id: string;
    stock: number;
  }>(
    `
      SELECT id, stock
      FROM product_variants
      WHERE id = ANY($1::text[])
      ORDER BY id
      FOR UPDATE
    `,
    [reservations.map((reservation) => reservation.variantId)],
  );
  const stockByVariant = new Map(
    stockResult.rows.map((variant) => [variant.id, variant.stock]),
  );
  const stockCanBeFinalized = reservations.every((reservation) => {
    const stock = stockByVariant.get(reservation.variantId);

    return typeof stock === "number" && stock >= reservation.quantity;
  });

  if (!stockCanBeFinalized) {
    await markPaymentRequiresReview(
      client,
      payment,
      payload,
      parseGrossAmount(payload.gross_amount) ?? payment.amount,
    );

    return "INSUFFICIENT_STOCK_REVIEW_REQUIRED";
  }

  await client.query(
    `
      UPDATE product_variants AS variant
      SET stock = variant.stock - item.quantity
      FROM jsonb_to_recordset($1::jsonb) AS item(
        "variantId" text,
        quantity int
      )
      WHERE variant.id = item."variantId"
    `,
    [
      JSON.stringify(
        reservations.map((reservation) => ({
          variantId: reservation.variantId,
          quantity: reservation.quantity,
        })),
      ),
    ],
  );
  await client.query(
    `
      UPDATE stock_reservations
      SET
        status = 'CONSUMED',
        "releasedAt" = COALESCE("releasedAt", NOW())
      WHERE "orderId" = $1
        AND status = 'ACTIVE'
    `,
    [payment.orderId],
  );
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
        'SALE_CONFIRMED',
        -item.quantity,
        'Pembayaran Midtrans berhasil'
      FROM jsonb_to_recordset($2::jsonb) AS item(
        "variantId" text,
        "reservationId" text,
        quantity int
      )
    `,
    [
      payment.orderId,
      JSON.stringify(
        reservations.map((reservation) => ({
          variantId: reservation.variantId,
          reservationId: reservation.id,
          quantity: reservation.quantity,
        })),
      ),
    ],
  );
  await updatePaymentAndOrderStatus(client, payment, payload, "PAID");

  return "SALE_FINALIZED";
}

async function releaseReservations(
  client: PoolClient,
  orderId: string,
  paymentStatus: PaymentStatus,
) {
  const note =
    paymentStatus === "EXPIRED"
      ? "Pembayaran Midtrans kedaluwarsa"
      : "Pembayaran Midtrans tidak berhasil";

  const reservationResult = await client.query<{
    id: string;
    variantId: string;
    quantity: number;
  }>(
    `
      UPDATE stock_reservations
      SET
        status = CASE WHEN $2 = 'EXPIRED' THEN 'EXPIRED'::"StockReservationStatus" ELSE 'RELEASED'::"StockReservationStatus" END,
        "releasedAt" = COALESCE("releasedAt", NOW())
      WHERE "orderId" = $1
        AND status = 'ACTIVE'
      RETURNING id, "variantId", quantity
    `,
    [orderId, paymentStatus],
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
        $3
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
      note,
    ],
  );
}

async function updatePaymentAndOrderStatus(
  client: PoolClient,
  payment: PaymentForUpdate,
  payload: MidtransNotificationPayload,
  status: PaymentStatus,
) {
  await updatePaymentGatewayFields(client, payment.id, payload, status);
  await client.query(
    `
      UPDATE orders
      SET
        "paymentStatus" = $2::"PaymentStatus",
        "fulfillmentStatus" = CASE
          WHEN $2 = 'PAID' THEN 'PROCESSING'::"FulfillmentStatus"
          WHEN $2 IN ('EXPIRED', 'FAILED', 'CANCELLED') THEN 'CANCELLED'::"FulfillmentStatus"
          ELSE "fulfillmentStatus"
        END
      WHERE id = $1
    `,
    [payment.orderId, status],
  );
}

async function updatePaymentGatewayFields(
  client: PoolClient,
  paymentId: string,
  payload: MidtransNotificationPayload,
  status: PaymentStatus,
) {
  await client.query(
    `
      UPDATE payments
      SET
        status = $2::"PaymentStatus",
        "gatewayTransactionId" = COALESCE($3, "gatewayTransactionId"),
        "paymentType" = COALESCE($4, "paymentType"),
        "grossAmount" = COALESCE($5, "grossAmount"),
        "lastStatusCode" = $6,
        "lastStatusMessage" = $7,
        "fraudStatus" = $8,
        "settlementTime" = CASE WHEN $9::text IS NULL OR $9::text = '' THEN "settlementTime" ELSE $9::timestamptz END,
        "paidAt" = CASE WHEN $2 = 'PAID' THEN COALESCE("paidAt", NOW()) ELSE "paidAt" END,
        "cancelledAt" = CASE WHEN $2 = 'CANCELLED' THEN COALESCE("cancelledAt", NOW()) ELSE "cancelledAt" END,
        "failedAt" = CASE WHEN $2 = 'FAILED' THEN COALESCE("failedAt", NOW()) ELSE "failedAt" END,
        "rawResponse" = $10::jsonb
      WHERE id = $1
    `,
    [
      paymentId,
      status,
      payload.transaction_id ?? null,
      payload.payment_type ?? null,
      parseGrossAmount(payload.gross_amount),
      payload.status_code,
      payload.status_message ?? null,
      payload.fraud_status ?? null,
      payload.settlement_time ?? null,
      JSON.stringify(sanitizeMidtransPayload(payload)),
    ],
  );
}

export class MidtransNotificationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "MidtransNotificationError";
    this.code = code;
    this.status = status;
  }
}
