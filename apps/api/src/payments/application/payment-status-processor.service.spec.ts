import type { PaymentStatus } from '../domain/payment-gateway';

import type { PaymentNotificationTarget } from '../infrastructure/payment-notification.repository';

import {
  PaymentStatusProcessorError,
  PaymentStatusProcessorService,
  type ProcessGatewayPaymentStatusInput,
} from './payment-status-processor.service';

function createInput(
  overrides: Partial<ProcessGatewayPaymentStatusInput> = {},
): ProcessGatewayPaymentStatusInput {
  return {
    provider: 'doku',

    providerOrderId: 'BLS-TEST-001',

    providerTransactionId: 'DOKU-REF-001',

    amount: 169650,

    status: 'PAID',

    paidAt: '2026-08-27T15:00:00.000Z',

    rawResponse: {
      responseCode: '2004700',
    },

    ...overrides,
  };
}

function createTarget(
  overrides: Partial<PaymentNotificationTarget> = {},
): PaymentNotificationTarget {
  return {
    orderId: 'order-1',

    orderNumber: 'BLS-TEST-001',

    orderPaymentStatus: 'PENDING',

    paymentId: 'payment-1',

    paymentStatus: 'PENDING',

    amount: 169650,

    provider: 'doku',

    providerOrderId: 'BLS-TEST-001',

    providerTransactionId: 'DOKU-REF-001',

    ...overrides,
  };
}

describe('PaymentStatusProcessorService', () => {
  let paymentNotificationRepositoryMock: {
    findTarget: jest.Mock;
  };

  let paymentSettlementRepositoryMock: {
    applyGatewayStatus: jest.Mock;
  };

  let service: PaymentStatusProcessorService;

  beforeEach(() => {
    paymentNotificationRepositoryMock = {
      findTarget: jest.fn(),
    };

    paymentSettlementRepositoryMock = {
      applyGatewayStatus: jest.fn(),
    };

    service = new PaymentStatusProcessorService(
      paymentNotificationRepositoryMock as never,

      paymentSettlementRepositoryMock as never,
    );
  });

  it('rejects incomplete gateway references', async () => {
    await expect(
      service.process(
        createInput({
          providerTransactionId: '   ',
        }),
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_PAYMENT_REFERENCE',

      status: 400,
    } satisfies Partial<PaymentStatusProcessorError>);

    expect(paymentNotificationRepositoryMock.findTarget).not.toHaveBeenCalled();

    expect(
      paymentSettlementRepositoryMock.applyGatewayStatus,
    ).not.toHaveBeenCalled();
  });

  it('rejects an invalid gateway amount', async () => {
    await expect(
      service.process(
        createInput({
          amount: 0,
        }),
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_PAYMENT_AMOUNT',

      status: 400,
    } satisfies Partial<PaymentStatusProcessorError>);

    expect(paymentNotificationRepositoryMock.findTarget).not.toHaveBeenCalled();

    expect(
      paymentSettlementRepositoryMock.applyGatewayStatus,
    ).not.toHaveBeenCalled();
  });

  it('throws PAYMENT_NOT_FOUND when the gateway reference does not match a payment', async () => {
    paymentNotificationRepositoryMock.findTarget.mockResolvedValue(null);

    await expect(service.process(createInput())).rejects.toMatchObject({
      code: 'PAYMENT_NOT_FOUND',

      status: 404,
    } satisfies Partial<PaymentStatusProcessorError>);

    expect(paymentNotificationRepositoryMock.findTarget).toHaveBeenCalledWith({
      provider: 'doku',

      providerOrderId: 'BLS-TEST-001',

      providerTransactionId: 'DOKU-REF-001',
    });

    expect(
      paymentSettlementRepositoryMock.applyGatewayStatus,
    ).not.toHaveBeenCalled();
  });

  it('normalizes references before finding the payment', async () => {
    paymentNotificationRepositoryMock.findTarget.mockResolvedValue(
      createTarget(),
    );

    paymentSettlementRepositoryMock.applyGatewayStatus.mockResolvedValue({
      action: 'FINALIZE_SALE',

      targetStatus: 'PAID',

      reason: 'Payment completed.',
    });

    await service.process(
      createInput({
        provider: '  doku  ',

        providerOrderId: '  BLS-TEST-001  ',

        providerTransactionId: '  DOKU-REF-001  ',
      }),
    );

    expect(paymentNotificationRepositoryMock.findTarget).toHaveBeenCalledWith({
      provider: 'doku',

      providerOrderId: 'BLS-TEST-001',

      providerTransactionId: 'DOKU-REF-001',
    });
  });

  it('rejects settlement when gateway amount does not match the database payment amount', async () => {
    paymentNotificationRepositoryMock.findTarget.mockResolvedValue(
      createTarget({
        amount: 169650,
      }),
    );

    await expect(
      service.process(
        createInput({
          amount: 1,
        }),
      ),
    ).rejects.toMatchObject({
      code: 'PAYMENT_AMOUNT_MISMATCH',

      status: 409,
    } satisfies Partial<PaymentStatusProcessorError>);

    expect(
      paymentSettlementRepositoryMock.applyGatewayStatus,
    ).not.toHaveBeenCalled();
  });

  it('passes a valid gateway status to transactional settlement', async () => {
    paymentNotificationRepositoryMock.findTarget.mockResolvedValue(
      createTarget(),
    );

    paymentSettlementRepositoryMock.applyGatewayStatus.mockResolvedValue({
      action: 'FINALIZE_SALE',

      targetStatus: 'PAID',

      reason: 'Payment completed.',
    });

    const input = createInput();

    const result = await service.process(input);

    expect(
      paymentSettlementRepositoryMock.applyGatewayStatus,
    ).toHaveBeenCalledWith(
      'order-1',

      'payment-1',

      {
        provider: 'doku',

        providerOrderId: 'BLS-TEST-001',

        providerTransactionId: 'DOKU-REF-001',

        status: 'PAID',

        paidAt: '2026-08-27T15:00:00.000Z',

        rawResponse: {
          responseCode: '2004700',
        },
      },
    );

    expect(result).toEqual({
      orderNumber: 'BLS-TEST-001',

      action: 'FINALIZE_SALE',

      paymentStatus: 'PAID',

      reason: 'Payment completed.',
    });
  });

  it('passes a non-paid gateway status without changing its meaning', async () => {
    paymentNotificationRepositoryMock.findTarget.mockResolvedValue(
      createTarget(),
    );

    paymentSettlementRepositoryMock.applyGatewayStatus.mockResolvedValue({
      action: 'RELEASE_RESERVATION',

      targetStatus: 'FAILED',

      reason: 'Payment failed.',
    });

    const result = await service.process(
      createInput({
        status: 'FAILED' as PaymentStatus,

        paidAt: null,
      }),
    );

    expect(
      paymentSettlementRepositoryMock.applyGatewayStatus,
    ).toHaveBeenCalledWith(
      'order-1',

      'payment-1',

      expect.objectContaining({
        status: 'FAILED',

        paidAt: null,
      }),
    );

    expect(result).toMatchObject({
      action: 'RELEASE_RESERVATION',

      paymentStatus: 'FAILED',
    });
  });
});
