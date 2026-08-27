import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';

import { DatabaseService } from '../../database/database.service';

import type {
  PaymentStatus,
  PaymentStatusResult,
} from '../domain/payment-gateway';

import {
  decidePaymentTransition,
  type PaymentTransitionDecision,
} from '../domain/payment-transition';

type LockedPaymentState = {
  orderPaymentStatus: PaymentStatus;

  paymentStatus: PaymentStatus;
};

type ReservationRow = {
  id: string;

  status: string;

  variantId: string;

  quantity: number;

  expiresAt: Date;
};

@Injectable()
export class PaymentSettlementRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async applyGatewayStatus(
    orderId: string,
    paymentId: string,
    gatewayStatus: PaymentStatusResult,
  ): Promise<PaymentTransitionDecision> {
    return this.databaseService.withTransaction(async (client) => {
      const current = await this.lockPaymentState(client, orderId, paymentId);

      if (!current) {
        throw new Error('Payment settlement target was not found.');
      }

      if (current.orderPaymentStatus !== current.paymentStatus) {
        const decision: PaymentTransitionDecision = {
          action: 'REQUIRES_REVIEW',

          targetStatus: 'REQUIRES_REVIEW',

          reason: 'Order and payment statuses are inconsistent.',
        };

        await this.updatePaymentState(
          client,
          paymentId,
          gatewayStatus,
          decision.targetStatus,
        );

        await this.updateOrderState(client, orderId, decision.targetStatus);

        return decision;
      }

      const decision = decidePaymentTransition(
        current.paymentStatus,
        gatewayStatus.status,
      );

      switch (decision.action) {
        case 'FINALIZE_SALE':
          return this.finalizeSale(
            client,
            orderId,
            paymentId,
            gatewayStatus,
            decision,
          );

        case 'RELEASE_RESERVATION':
          await this.releaseActiveReservations(
            client,
            orderId,
            decision.targetStatus,
          );

          await this.updatePaymentState(
            client,
            paymentId,
            gatewayStatus,
            decision.targetStatus,
          );

          await this.updateOrderState(client, orderId, decision.targetStatus);

          return decision;

        case 'REQUIRES_REVIEW':
          await this.updatePaymentState(
            client,
            paymentId,
            gatewayStatus,
            decision.targetStatus,
          );

          await this.updateOrderState(client, orderId, decision.targetStatus);

          return decision;

        case 'NOOP':
          await this.updatePaymentState(
            client,
            paymentId,
            gatewayStatus,
            decision.targetStatus,
          );

          return decision;
      }
    });
  }

  private async lockPaymentState(
    client: PoolClient,
    orderId: string,
    paymentId: string,
  ): Promise<LockedPaymentState | null> {
    const result = await client.query<LockedPaymentState>(
      `
          SELECT
            o."paymentStatus"::text
              AS "orderPaymentStatus",

            p.status::text
              AS "paymentStatus"

          FROM orders o

          INNER JOIN payments p
            ON p."orderId" = o.id

          WHERE o.id = $1
            AND p.id = $2

          FOR UPDATE OF o, p
        `,
      [orderId, paymentId],
    );

    return result.rows[0] ?? null;
  }

  private async finalizeSale(
    client: PoolClient,
    orderId: string,
    paymentId: string,
    gatewayStatus: PaymentStatusResult,
    decision: PaymentTransitionDecision,
  ): Promise<PaymentTransitionDecision> {
    const reservationResult = await client.query<ReservationRow>(
      `
          SELECT
            id::text AS id,

            status::text AS status,

            "variantId",

            quantity,

            "expiresAt"

          FROM stock_reservations

          WHERE "orderId" = $1

          ORDER BY "variantId"

          FOR UPDATE
        `,
      [orderId],
    );

    const reservations = reservationResult.rows;

    const now = new Date();

    const allReservationsActive =
      reservations.length > 0 &&
      reservations.every(
        (reservation) =>
          reservation.status === 'ACTIVE' && reservation.expiresAt > now,
      );

    if (!allReservationsActive) {
      return this.markRequiresReview(
        client,
        orderId,
        paymentId,
        gatewayStatus,
        'Payment succeeded but its stock reservation is no longer active.',
      );
    }

    const stockResult = await client.query<{
      id: string;

      stock: number;
    }>(
      `
          SELECT
            id,

            stock

          FROM product_variants

          WHERE id = ANY(
            $1::text[]
          )

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

      return typeof stock === 'number' && stock >= reservation.quantity;
    });

    if (!stockCanBeFinalized) {
      return this.markRequiresReview(
        client,
        orderId,
        paymentId,
        gatewayStatus,
        'Payment succeeded but physical stock is insufficient.',
      );
    }

    await client.query(
      `
        UPDATE product_variants
          AS variant

        SET
          stock =
            variant.stock -
            item.quantity

        FROM jsonb_to_recordset(
          $1::jsonb
        ) AS item(
          "variantId" text,
          quantity int
        )

        WHERE
          variant.id =
          item."variantId"
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
          status =
            'CONSUMED'
              ::"StockReservationStatus",

          "releasedAt" =
            COALESCE(
              "releasedAt",
              NOW()
            )

        WHERE "orderId" = $1
          AND status =
            'ACTIVE'
      `,
      [orderId],
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

          'Pembayaran berhasil dikonfirmasi'

        FROM jsonb_to_recordset(
          $2::jsonb
        ) AS item(
          "variantId" text,
          "reservationId" text,
          quantity int
        )
      `,
      [
        orderId,

        JSON.stringify(
          reservations.map((reservation) => ({
            variantId: reservation.variantId,

            reservationId: reservation.id,

            quantity: reservation.quantity,
          })),
        ),
      ],
    );

    await this.updatePaymentState(client, paymentId, gatewayStatus, 'PAID');

    await this.updateOrderState(client, orderId, 'PAID');

    return decision;
  }

  private async markRequiresReview(
    client: PoolClient,
    orderId: string,
    paymentId: string,
    gatewayStatus: PaymentStatusResult,
    reason: string,
  ): Promise<PaymentTransitionDecision> {
    await this.updatePaymentState(
      client,
      paymentId,
      gatewayStatus,
      'REQUIRES_REVIEW',
    );

    await this.updateOrderState(client, orderId, 'REQUIRES_REVIEW');

    return {
      action: 'REQUIRES_REVIEW',

      targetStatus: 'REQUIRES_REVIEW',

      reason,
    };
  }

  private async releaseActiveReservations(
    client: PoolClient,
    orderId: string,
    paymentStatus: PaymentStatus,
  ): Promise<void> {
    const reservationResult = await client.query<{
      id: string;

      variantId: string;

      quantity: number;
    }>(
      `
          UPDATE stock_reservations

          SET
            status =
              CASE
                WHEN $2 = 'EXPIRED'
                  THEN
                    'EXPIRED'
                      ::"StockReservationStatus"

                ELSE
                    'RELEASED'
                      ::"StockReservationStatus"
              END,

            "releasedAt" =
              COALESCE(
                "releasedAt",
                NOW()
              )

          WHERE "orderId" = $1
            AND status =
              'ACTIVE'

          RETURNING
            id::text AS id,

            "variantId",

            quantity
        `,
      [orderId, paymentStatus],
    );

    if (reservationResult.rows.length === 0) {
      return;
    }

    const note =
      paymentStatus === 'EXPIRED'
        ? 'Reservasi stok dilepas karena pembayaran kedaluwarsa'
        : 'Reservasi stok dilepas karena pembayaran tidak berhasil';

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

        FROM jsonb_to_recordset(
          $2::jsonb
        ) AS item(
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

  private async updatePaymentState(
    client: PoolClient,
    paymentId: string,
    gatewayStatus: PaymentStatusResult,
    status: PaymentStatus,
  ): Promise<void> {
    const paidAt = parseGatewayDate(gatewayStatus.paidAt);

    await client.query(
      `
        UPDATE payments

        SET
          provider =
            $3,

          "providerOrderId" =
            $4,

          "gatewayTransactionId" =
            COALESCE(
              $5,
              "gatewayTransactionId"
            ),

          status =
            $2::"PaymentStatus",

          "paidAt" =
            CASE
              WHEN $2 = 'PAID'
                THEN COALESCE(
                  "paidAt",
                  $6::timestamptz,
                  NOW()
                )

              ELSE "paidAt"
            END,

          "cancelledAt" =
            CASE
              WHEN $2 = 'CANCELLED'
                THEN COALESCE(
                  "cancelledAt",
                  NOW()
                )

              ELSE "cancelledAt"
            END,

          "failedAt" =
            CASE
              WHEN $2 = 'FAILED'
                THEN COALESCE(
                  "failedAt",
                  NOW()
                )

              ELSE "failedAt"
            END,

          "rawResponse" =
            $7::jsonb

        WHERE id = $1
      `,
      [
        paymentId,

        status,

        gatewayStatus.provider,

        gatewayStatus.providerOrderId,

        gatewayStatus.providerTransactionId,

        paidAt,

        JSON.stringify(gatewayStatus.rawResponse ?? {}),
      ],
    );
  }

  private async updateOrderState(
    client: PoolClient,
    orderId: string,
    status: PaymentStatus,
  ): Promise<void> {
    await client.query(
      `
        UPDATE orders

        SET
          "paymentStatus" =
            $2::"PaymentStatus",

          "fulfillmentStatus" =
            CASE
              WHEN $2 = 'PAID'
                THEN
                  'PROCESSING'
                    ::"FulfillmentStatus"

              WHEN $2 IN (
                'EXPIRED',
                'FAILED',
                'CANCELLED'
              )
                THEN
                  'CANCELLED'
                    ::"FulfillmentStatus"

              ELSE
                "fulfillmentStatus"
            END

        WHERE id = $1
      `,
      [orderId, status],
    );
  }
}

function parseGatewayDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}
