import { Injectable } from '@nestjs/common';

import type {
  PaymentStatus,
  PaymentStatusResult,
} from '../domain/payment-gateway';

import type { PaymentTransitionAction } from '../domain/payment-transition';

import {
  PaymentNotificationRepository,
  type PaymentNotificationTarget,
} from '../infrastructure/payment-notification.repository';

import { PaymentSettlementRepository } from '../infrastructure/payment-settlement.repository';

export type ProcessGatewayPaymentStatusInput = {
  provider: string;

  providerOrderId: string;

  providerTransactionId: string;

  amount: number;

  status: PaymentStatus;

  paidAt: string | null;

  rawResponse?: Record<string, unknown>;
};

export type ProcessGatewayPaymentStatusResult = {
  orderNumber: string;

  action: PaymentTransitionAction;

  paymentStatus: PaymentStatus;

  reason: string;
};

@Injectable()
export class PaymentStatusProcessorService {
  constructor(
    private readonly paymentNotificationRepository: PaymentNotificationRepository,

    private readonly paymentSettlementRepository: PaymentSettlementRepository,
  ) {}

  async process(
    input: ProcessGatewayPaymentStatusInput,
  ): Promise<ProcessGatewayPaymentStatusResult> {
    const normalizedInput = normalizeInput(input);

    const target = await this.findTarget(normalizedInput);

    validateAmount(target, normalizedInput.amount);

    const gatewayStatus: PaymentStatusResult = {
      provider: normalizedInput.provider,

      providerOrderId: normalizedInput.providerOrderId,

      providerTransactionId: normalizedInput.providerTransactionId,

      status: normalizedInput.status,

      paidAt: normalizedInput.paidAt,

      rawResponse: normalizedInput.rawResponse ?? {},
    };

    const decision = await this.paymentSettlementRepository.applyGatewayStatus(
      target.orderId,

      target.paymentId,

      gatewayStatus,
    );

    return {
      orderNumber: target.orderNumber,

      action: decision.action,

      paymentStatus: decision.targetStatus,

      reason: decision.reason,
    };
  }

  private async findTarget(
    input: ProcessGatewayPaymentStatusInput,
  ): Promise<PaymentNotificationTarget> {
    const target = await this.paymentNotificationRepository.findTarget({
      provider: input.provider,

      providerOrderId: input.providerOrderId,

      providerTransactionId: input.providerTransactionId,
    });

    if (!target) {
      throw new PaymentStatusProcessorError(
        'PAYMENT_NOT_FOUND',

        'Payment yang sesuai dengan notifikasi gateway tidak ditemukan.',

        404,
      );
    }

    return target;
  }
}

function normalizeInput(
  input: ProcessGatewayPaymentStatusInput,
): ProcessGatewayPaymentStatusInput {
  const provider = input.provider.trim();

  const providerOrderId = input.providerOrderId.trim();

  const providerTransactionId = input.providerTransactionId.trim();

  if (!provider || !providerOrderId || !providerTransactionId) {
    throw new PaymentStatusProcessorError(
      'INVALID_PAYMENT_REFERENCE',

      'Reference payment gateway tidak lengkap.',

      400,
    );
  }

  if (
    !Number.isFinite(input.amount) ||
    input.amount <= 0 ||
    !Number.isSafeInteger(input.amount)
  ) {
    throw new PaymentStatusProcessorError(
      'INVALID_PAYMENT_AMOUNT',

      'Nominal payment gateway tidak valid.',

      400,
    );
  }

  return {
    ...input,

    provider,

    providerOrderId,

    providerTransactionId,
  };
}

function validateAmount(
  target: PaymentNotificationTarget,
  gatewayAmount: number,
): void {
  if (target.amount !== gatewayAmount) {
    throw new PaymentStatusProcessorError(
      'PAYMENT_AMOUNT_MISMATCH',

      'Nominal payment gateway tidak sesuai dengan nominal order.',

      409,
    );
  }
}

export class PaymentStatusProcessorError extends Error {
  code: string;

  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);

    this.name = 'PaymentStatusProcessorError';

    this.code = code;

    this.status = status;
  }
}
