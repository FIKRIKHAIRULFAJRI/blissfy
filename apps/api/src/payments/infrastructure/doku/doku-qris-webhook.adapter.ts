import { Injectable } from '@nestjs/common';

import {
  PaymentStatusProcessorService,
  type ProcessGatewayPaymentStatusResult,
} from '../../application/payment-status-processor.service';

import {
  getDokuPaidAt,
  mapDokuNotificationStatus,
  parseDokuNotificationAmount,
  parseDokuQrisNotification,
} from './doku-qris-notification.schema';

import { DokuNotificationSignatureVerifier } from './doku-notification-signature.verifier';

export const DOKU_QRIS_WEBHOOK_ROUTE = 'v1.0/qr/qr-mpm-notify';

export const DOKU_QRIS_WEBHOOK_PATH = `/${DOKU_QRIS_WEBHOOK_ROUTE}`;

export type ProcessDokuQrisWebhookInput = {
  method: string;

  authorization: string;

  timestamp: string;

  partnerId: string;

  signature: string;

  body: unknown;
};

@Injectable()
export class DokuQrisWebhookAdapter {
  constructor(
    private readonly signatureVerifier: DokuNotificationSignatureVerifier,

    private readonly paymentStatusProcessor: PaymentStatusProcessorService,
  ) {}

  async process(
    input: ProcessDokuQrisWebhookInput,
  ): Promise<ProcessGatewayPaymentStatusResult> {
    this.signatureVerifier.verify({
      method: input.method,

      endpointPath: DOKU_QRIS_WEBHOOK_PATH,

      authorization: input.authorization,

      timestamp: input.timestamp,

      partnerId: input.partnerId,

      signature: input.signature,

      body: input.body,
    });

    const notification = parseDokuQrisNotification(input.body);

    const amount = parseDokuNotificationAmount(notification.amount);

    const status = mapDokuNotificationStatus(
      notification.latestTransactionStatus,
    );

    const paidAt = getDokuPaidAt(notification);

    return this.paymentStatusProcessor.process({
      provider: 'doku',

      providerOrderId: notification.originalPartnerReferenceNo,

      providerTransactionId: notification.originalReferenceNo,

      amount,

      status,

      paidAt,

      rawResponse: notification,
    });
  }
}
