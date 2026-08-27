import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';

import { DatabaseService } from '../../database/database.service';

import type {
  PaymentStatus,
  QrisPaymentResult,
} from '../domain/payment-gateway';

export type PaymentAccessRow = {
  orderId: string;

  orderNumber: string;

  accessTokenHash: string;

  orderPaymentStatus: PaymentStatus;

  fulfillmentStatus: string;

  totalPayment: number;

  orderExpiresAt: Date;

  recipientName: string;

  email: string;

  whatsapp: string;

  paymentId: string;

  provider: string | null;

  providerOrderId: string | null;

  gatewayTransactionId: string | null;

  paymentStatus: PaymentStatus;

  amount: number;

  qrImageUrl: string | null;

  qrString: string | null;

  paidAt: Date | null;

  paymentExpiresAt: Date;
};

@Injectable()
export class PaymentsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByAccessTokenHash(
    accessTokenHash: string,
  ): Promise<PaymentAccessRow | null> {
    const result = await this.databaseService.query<PaymentAccessRow>(
      `
          SELECT
            o.id::text AS "orderId",

            o."orderNumber",

            o."accessTokenHash",

            o."paymentStatus"::text
              AS "orderPaymentStatus",

            o."fulfillmentStatus"::text
              AS "fulfillmentStatus",

            o."totalPayment",

            o."expiresAt"
              AS "orderExpiresAt",

            o."recipientName",

            o.email,

            o.whatsapp,

            p.id::text AS "paymentId",

            p.provider,

            p."providerOrderId",

            p."gatewayTransactionId",

            p.status::text
              AS "paymentStatus",

            p.amount,

            p."qrImageUrl",

            p."qrString",

            p."paidAt",

            p."expiresAt"
              AS "paymentExpiresAt"

          FROM orders o

          INNER JOIN payments p
            ON p."orderId" = o.id

          WHERE o."accessTokenHash" = $1

          LIMIT 1
        `,
      [accessTokenHash],
    );

    return result.rows[0] ?? null;
  }

  async updateFromQris(
    paymentId: string,
    payment: QrisPaymentResult,
  ): Promise<void> {
    await this.databaseService.query(
      `
        UPDATE payments

        SET
          provider = $2,

          "providerOrderId" = $3,

          "gatewayTransactionId" = $4,

          "qrImageUrl" = $5,

          "qrString" = $6,

          "rawResponse" = $7::jsonb

        WHERE id = $1
      `,
      [
        paymentId,

        payment.provider,

        payment.providerOrderId,

        payment.providerTransactionId,

        payment.qrImageUrl,

        payment.qrString,

        JSON.stringify(payment.rawResponse ?? {}),
      ],
    );
  }

  async expirePaymentAndReleaseReservations(
    orderId: string,
    paymentId: string,
  ): Promise<boolean> {
    return this.databaseService.withTransaction(async (client) => {
      const state = await client.query<{
        orderPaymentStatus: PaymentStatus;
        paymentStatus: PaymentStatus;
      }>(
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

      const current = state.rows[0];

      if (
        !current ||
        current.orderPaymentStatus !== 'PENDING' ||
        current.paymentStatus !== 'PENDING'
      ) {
        return false;
      }

      await client.query(
        `
            UPDATE payments

            SET
              status = 'EXPIRED'

            WHERE id = $1
          `,
        [paymentId],
      );

      await client.query(
        `
            UPDATE orders

            SET
              "paymentStatus" = 'EXPIRED',

              "fulfillmentStatus" =
                'CANCELLED'

            WHERE id = $1
          `,
        [orderId],
      );

      await this.releaseActiveReservations(client, orderId);

      return true;
    });
  }

  private async releaseActiveReservations(
    client: PoolClient,
    orderId: string,
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
              'EXPIRED'::"StockReservationStatus",

            "releasedAt" =
              COALESCE(
                "releasedAt",
                NOW()
              )

          WHERE "orderId" = $1
            AND status = 'ACTIVE'

          RETURNING
            id,

            "variantId",

            quantity
        `,
      [orderId],
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
      ],
    );
  }
}
