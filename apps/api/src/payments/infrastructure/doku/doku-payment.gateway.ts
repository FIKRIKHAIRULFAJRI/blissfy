import { Injectable } from '@nestjs/common';

import {
  type CreateQrisPaymentInput,
  type GetPaymentStatusInput,
  type PaymentGateway,
  type PaymentStatus,
  type PaymentStatusResult,
  type QrisPaymentResult,
} from '../../domain/payment-gateway';

import { DokuQrisClient } from './doku-qris.client';

@Injectable()
export class DokuPaymentGateway implements PaymentGateway {
  constructor(private readonly dokuQrisClient: DokuQrisClient) {}

  async createQrisPayment(
    input: CreateQrisPaymentInput,
  ): Promise<QrisPaymentResult> {
    const result = await this.dokuQrisClient.generateQris({
      partnerReferenceNo: input.orderNumber,

      amount: input.amount,

      expiresAt: input.expiresAt,

      additionalInfo: {},
    });

    return {
      provider: 'doku',

      providerOrderId: result.partnerReferenceNo,

      providerTransactionId: result.referenceNo,

      status: 'PENDING',

      amount: input.amount,

      qrImageUrl: null,

      qrString: result.qrContent,

      expiresAt: input.expiresAt.toISOString(),

      rawResponse: result.rawResponse,
    };
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput,
  ): Promise<PaymentStatusResult> {
    if (!input.providerTransactionId) {
      return {
        provider: 'doku',

        providerOrderId: input.providerOrderId,

        providerTransactionId: null,

        status: 'REQUIRES_REVIEW',

        paidAt: null,

        rawResponse: {
          reason: 'DOKU_REFERENCE_NO_MISSING',
        },
      };
    }

    const result = await this.dokuQrisClient.queryQris({
      originalReferenceNo: input.providerTransactionId,

      originalPartnerReferenceNo: input.providerOrderId,
    });

    const status = mapDokuTransactionStatus(result.latestTransactionStatus);

    return {
      provider: 'doku',

      providerOrderId: result.originalPartnerReferenceNo,

      providerTransactionId: result.originalReferenceNo,

      status,

      paidAt: status === 'PAID' ? result.paidTime : null,

      rawResponse: result.rawResponse,
    };
  }
}

export function mapDokuTransactionStatus(status: string | null): PaymentStatus {
  switch (status) {
    case '00':
      return 'PAID';

    case '01':
    case '02':
    case '03':
      return 'PENDING';

    case '04':
      return 'REFUNDED';

    case '05':
      return 'CANCELLED';

    case '06':
      return 'FAILED';

    case '07':
      return 'REQUIRES_REVIEW';

    default:
      return 'REQUIRES_REVIEW';
  }
}
