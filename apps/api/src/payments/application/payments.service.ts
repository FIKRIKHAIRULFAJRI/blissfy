import { Inject, Injectable } from '@nestjs/common';

import { hashSecret } from '../../orders/domain/hash';

import {
  PAYMENT_GATEWAY,
  type PaymentGateway,
  type PaymentStatus,
} from '../domain/payment-gateway';

import {
  PaymentsRepository,
  type PaymentAccessRow,
} from '../infrastructure/payments.repository';

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

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,

    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async createOrGetQrisPayment(
    accessToken: string,
  ): Promise<PublicPaymentState> {
    let paymentRow = await this.findPaymentByAccessToken(accessToken);

    if (
      paymentRow.orderPaymentStatus !== 'PENDING' ||
      paymentRow.paymentStatus !== 'PENDING'
    ) {
      return toPublicPaymentState(paymentRow);
    }

    if (isExpired(paymentRow)) {
      await this.paymentsRepository.expirePaymentAndReleaseReservations(
        paymentRow.orderId,
        paymentRow.paymentId,
      );

      paymentRow = await this.findPaymentByAccessToken(accessToken);

      return toPublicPaymentState(paymentRow);
    }

    if (
      paymentRow.providerOrderId &&
      (paymentRow.qrImageUrl || paymentRow.qrString)
    ) {
      return toPublicPaymentState(paymentRow);
    }

    try {
      const gatewayPayment = await this.paymentGateway.createQrisPayment({
        orderNumber: paymentRow.orderNumber,

        amount: paymentRow.amount,

        expiresAt: paymentRow.paymentExpiresAt,

        customer: {
          name: paymentRow.recipientName,

          email: paymentRow.email,

          phone: paymentRow.whatsapp,
        },
      });

      await this.paymentsRepository.updateFromQris(
        paymentRow.paymentId,
        gatewayPayment,
      );

      return {
        orderNumber: paymentRow.orderNumber,

        paymentStatus: gatewayPayment.status,

        fulfillmentStatus: paymentRow.fulfillmentStatus,

        amount: gatewayPayment.amount,

        provider: gatewayPayment.provider,

        providerOrderId: gatewayPayment.providerOrderId,

        providerTransactionId: gatewayPayment.providerTransactionId,

        qrImageUrl: gatewayPayment.qrImageUrl,

        qrString: gatewayPayment.qrString,

        expiresAt: gatewayPayment.expiresAt,

        paidAt: null,

        isPaymentGatewayConfigured: true,
      };
    } catch (error) {
      if (error instanceof PaymentServiceError) {
        throw error;
      }

      console.error('Create QRIS payment failed', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });

      throw new PaymentServiceError(
        'PAYMENT_CHARGE_FAILED',

        'QRIS belum dapat dibuat. Coba lagi.',

        503,
      );
    }
  }

  async getPublicPaymentStateByToken(
    accessToken: string,
  ): Promise<PublicPaymentState> {
    let paymentRow = await this.findPaymentByAccessToken(accessToken);

    if (
      paymentRow.orderPaymentStatus === 'PENDING' &&
      paymentRow.paymentStatus === 'PENDING' &&
      isExpired(paymentRow)
    ) {
      await this.paymentsRepository.expirePaymentAndReleaseReservations(
        paymentRow.orderId,
        paymentRow.paymentId,
      );

      paymentRow = await this.findPaymentByAccessToken(accessToken);
    }

    return toPublicPaymentState(paymentRow);
  }

  private async findPaymentByAccessToken(accessToken: string) {
    const accessTokenHash = hashSecret(accessToken);

    const paymentRow =
      await this.paymentsRepository.findByAccessTokenHash(accessTokenHash);

    if (!paymentRow) {
      throw new PaymentServiceError(
        'ORDER_NOT_FOUND',

        'Link pembayaran tidak ditemukan.',

        404,
      );
    }

    return paymentRow;
  }
}

function isExpired(paymentRow: PaymentAccessRow) {
  const now = Date.now();

  return (
    paymentRow.orderExpiresAt.getTime() <= now ||
    paymentRow.paymentExpiresAt.getTime() <= now
  );
}

function toPublicPaymentState(
  paymentRow: PaymentAccessRow,
): PublicPaymentState {
  const paymentStatus =
    paymentRow.orderPaymentStatus === paymentRow.paymentStatus
      ? paymentRow.orderPaymentStatus
      : paymentRow.paymentStatus;

  return {
    orderNumber: paymentRow.orderNumber,

    paymentStatus,

    fulfillmentStatus: paymentRow.fulfillmentStatus,

    amount: paymentRow.amount,

    provider: paymentRow.provider,

    providerOrderId: paymentRow.providerOrderId,

    providerTransactionId: paymentRow.gatewayTransactionId,

    qrImageUrl: paymentRow.qrImageUrl,

    qrString: paymentRow.qrString,

    expiresAt: paymentRow.paymentExpiresAt.toISOString(),

    paidAt: paymentRow.paidAt?.toISOString() ?? null,

    isPaymentGatewayConfigured: true,
  };
}

export class PaymentServiceError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);

    this.name = 'PaymentServiceError';

    this.code = code;
    this.status = status;
  }
}
