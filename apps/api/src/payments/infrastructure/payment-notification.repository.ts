import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { PaymentStatus } from '../domain/payment-gateway';

export type PaymentNotificationTarget = {
  orderId: string;

  orderNumber: string;

  orderPaymentStatus: PaymentStatus;

  paymentId: string;

  paymentStatus: PaymentStatus;

  amount: number;

  provider: string;

  providerOrderId: string;

  providerTransactionId: string | null;
};

export type FindPaymentNotificationTargetInput = {
  provider: string;

  providerOrderId: string;

  providerTransactionId: string | null;
};

@Injectable()
export class PaymentNotificationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findTarget(
    input: FindPaymentNotificationTargetInput,
  ): Promise<PaymentNotificationTarget | null> {
    const result = await this.databaseService.query<PaymentNotificationTarget>(
      `
          SELECT
            o.id::text
              AS "orderId",

            o."orderNumber",

            o."paymentStatus"::text
              AS "orderPaymentStatus",

            p.id::text
              AS "paymentId",

            p.status::text
              AS "paymentStatus",

            p.amount,

            p.provider,

            p."providerOrderId",

            p."gatewayTransactionId"
              AS "providerTransactionId"

          FROM payments p

          INNER JOIN orders o
            ON o.id = p."orderId"

          WHERE p.provider = $1
            AND p."providerOrderId" = $2

            AND (
              $3::text IS NULL

              OR p."gatewayTransactionId" =
                $3
            )

          LIMIT 1
        `,
      [input.provider, input.providerOrderId, input.providerTransactionId],
    );

    return result.rows[0] ?? null;
  }
}
