import { hashSecret } from '../../orders/domain/hash';

import type {
  PaymentStatusResult,
  QrisPaymentResult,
} from '../domain/payment-gateway';

import { PaymentsService, PaymentServiceError } from './payments.service';

const futureDate = new Date(Date.now() + 10 * 60 * 1000);

const paidDate = new Date('2026-08-27T15:00:00.000Z');

function createPaymentRow(overrides: Record<string, unknown> = {}) {
  return {
    orderId: 'order-1',

    orderNumber: 'BLS-TEST-001',

    accessTokenHash: hashSecret('token-test'),

    orderPaymentStatus: 'PENDING',

    fulfillmentStatus: 'WAITING_PAYMENT',

    totalPayment: 169650,

    orderExpiresAt: futureDate,

    recipientName: 'Fikri',

    email: 'fikri@example.com',

    whatsapp: '081234567890',

    paymentId: 'payment-1',

    provider: null,

    providerOrderId: null,

    gatewayTransactionId: null,

    paymentStatus: 'PENDING',

    amount: 169650,

    qrImageUrl: null,

    qrString: null,

    paidAt: null,

    paymentExpiresAt: futureDate,

    ...overrides,
  };
}

describe('PaymentsService', () => {
  let paymentsRepositoryMock: {
    findByAccessTokenHash: jest.Mock;

    updateFromQris: jest.Mock;

    expirePaymentAndReleaseReservations: jest.Mock;
  };

  let paymentSettlementRepositoryMock: {
    applyGatewayStatus: jest.Mock;
  };

  let paymentGatewayMock: {
    createQrisPayment: jest.Mock;

    getPaymentStatus: jest.Mock;
  };

  let service: PaymentsService;

  beforeEach(() => {
    paymentsRepositoryMock = {
      findByAccessTokenHash: jest.fn(),

      updateFromQris: jest.fn(),

      expirePaymentAndReleaseReservations: jest.fn(),
    };

    paymentSettlementRepositoryMock = {
      applyGatewayStatus: jest.fn(),
    };

    paymentGatewayMock = {
      createQrisPayment: jest.fn(),

      getPaymentStatus: jest.fn(),
    };

    service = new PaymentsService(
      paymentsRepositoryMock as never,

      paymentSettlementRepositoryMock as never,

      paymentGatewayMock,
    );
  });

  it('throws ORDER_NOT_FOUND for an unknown access token', async () => {
    paymentsRepositoryMock.findByAccessTokenHash.mockResolvedValue(null);

    await expect(
      service.getPublicPaymentStateByToken('unknown-token'),
    ).rejects.toMatchObject({
      code: 'ORDER_NOT_FOUND',

      status: 404,
    } satisfies Partial<PaymentServiceError>);

    expect(paymentsRepositoryMock.findByAccessTokenHash).toHaveBeenCalledWith(
      hashSecret('unknown-token'),
    );
  });

  it('returns an existing QR without creating another gateway payment', async () => {
    const row = createPaymentRow({
      provider: 'mock',

      providerOrderId: 'BLS-TEST-001',

      gatewayTransactionId: 'mock-BLS-TEST-001',

      qrString: 'existing-qr',
    });

    paymentsRepositoryMock.findByAccessTokenHash.mockResolvedValue(row);

    const result = await service.createOrGetQrisPayment('token-test');

    expect(paymentGatewayMock.createQrisPayment).not.toHaveBeenCalled();

    expect(paymentsRepositoryMock.updateFromQris).not.toHaveBeenCalled();

    expect(result.qrString).toBe('existing-qr');
  });

  it('creates and persists a QRIS payment', async () => {
    const row = createPaymentRow();

    const gatewayResult: QrisPaymentResult = {
      provider: 'mock',

      providerOrderId: 'BLS-TEST-001',

      providerTransactionId: 'mock-BLS-TEST-001',

      status: 'PENDING',

      amount: 169650,

      qrImageUrl: 'data:image/svg+xml;base64,test',

      qrString: 'MOCK-QRIS',

      expiresAt: futureDate.toISOString(),

      rawResponse: {
        simulated: true,
      },
    };

    paymentsRepositoryMock.findByAccessTokenHash.mockResolvedValue(row);

    paymentGatewayMock.createQrisPayment.mockResolvedValue(gatewayResult);

    const result = await service.createOrGetQrisPayment('token-test');

    expect(paymentGatewayMock.createQrisPayment).toHaveBeenCalledWith({
      orderNumber: 'BLS-TEST-001',

      amount: 169650,

      expiresAt: futureDate,

      customer: {
        name: 'Fikri',

        email: 'fikri@example.com',

        phone: '081234567890',
      },
    });

    expect(paymentsRepositoryMock.updateFromQris).toHaveBeenCalledWith(
      'payment-1',
      gatewayResult,
    );

    expect(result.provider).toBe('mock');

    expect(result.qrString).toBe('MOCK-QRIS');
  });

  it('expires an unpaid order before creating QRIS when reservation has expired', async () => {
    const expiredDate = new Date(Date.now() - 60_000);

    const expiredRow = createPaymentRow({
      orderExpiresAt: expiredDate,

      paymentExpiresAt: expiredDate,
    });

    const reloadedRow = createPaymentRow({
      orderPaymentStatus: 'EXPIRED',

      paymentStatus: 'EXPIRED',

      fulfillmentStatus: 'CANCELLED',

      orderExpiresAt: expiredDate,

      paymentExpiresAt: expiredDate,
    });

    paymentsRepositoryMock.findByAccessTokenHash
      .mockResolvedValueOnce(expiredRow)
      .mockResolvedValueOnce(reloadedRow);

    await service.createOrGetQrisPayment('token-test');

    expect(
      paymentsRepositoryMock.expirePaymentAndReleaseReservations,
    ).toHaveBeenCalledWith('order-1', 'payment-1');

    expect(paymentGatewayMock.createQrisPayment).not.toHaveBeenCalled();
  });

  it('synchronizes a pending payment with the gateway and reloads the settled state', async () => {
    const pendingRow = createPaymentRow({
      provider: 'mock',

      providerOrderId: 'BLS-TEST-001',

      gatewayTransactionId: 'mock-BLS-TEST-001',

      qrString: 'MOCK-QRIS',
    });

    const settledRow = createPaymentRow({
      provider: 'mock',

      providerOrderId: 'BLS-TEST-001',

      gatewayTransactionId: 'mock-BLS-TEST-001',

      qrString: 'MOCK-QRIS',

      orderPaymentStatus: 'PAID',

      paymentStatus: 'PAID',

      fulfillmentStatus: 'PROCESSING',

      paidAt: paidDate,
    });

    const gatewayStatus: PaymentStatusResult = {
      provider: 'mock',

      providerOrderId: 'BLS-TEST-001',

      providerTransactionId: 'mock-BLS-TEST-001',

      status: 'PAID',

      paidAt: paidDate.toISOString(),

      rawResponse: {
        simulated: true,
      },
    };

    paymentsRepositoryMock.findByAccessTokenHash
      .mockResolvedValueOnce(pendingRow)
      .mockResolvedValueOnce(settledRow);

    paymentGatewayMock.getPaymentStatus.mockResolvedValue(gatewayStatus);

    paymentSettlementRepositoryMock.applyGatewayStatus.mockResolvedValue({
      action: 'FINALIZE_SALE',

      targetStatus: 'PAID',

      reason: 'Payment completed.',
    });

    const result = await service.getPublicPaymentStateByToken('token-test');

    expect(paymentGatewayMock.getPaymentStatus).toHaveBeenCalledWith({
      providerOrderId: 'BLS-TEST-001',

      providerTransactionId: 'mock-BLS-TEST-001',
    });

    expect(
      paymentSettlementRepositoryMock.applyGatewayStatus,
    ).toHaveBeenCalledWith('order-1', 'payment-1', gatewayStatus);

    expect(result.paymentStatus).toBe('PAID');

    expect(result.fulfillmentStatus).toBe('PROCESSING');
  });

  it('does not query the gateway before a payment has been created', async () => {
    const row = createPaymentRow();

    paymentsRepositoryMock.findByAccessTokenHash.mockResolvedValue(row);

    const result = await service.getPublicPaymentStateByToken('token-test');

    expect(paymentGatewayMock.getPaymentStatus).not.toHaveBeenCalled();

    expect(
      paymentSettlementRepositoryMock.applyGatewayStatus,
    ).not.toHaveBeenCalled();

    expect(result.paymentStatus).toBe('PENDING');
  });

  it('keeps the database state available when gateway synchronization fails', async () => {
    const row = createPaymentRow({
      provider: 'mock',

      providerOrderId: 'BLS-TEST-001',

      gatewayTransactionId: 'mock-BLS-TEST-001',

      qrString: 'MOCK-QRIS',
    });

    paymentsRepositoryMock.findByAccessTokenHash
      .mockResolvedValueOnce(row)
      .mockResolvedValueOnce(row);

    paymentGatewayMock.getPaymentStatus.mockRejectedValue(
      new Error('Gateway unavailable'),
    );

    const result = await service.getPublicPaymentStateByToken('token-test');

    expect(result.paymentStatus).toBe('PENDING');

    expect(
      paymentSettlementRepositoryMock.applyGatewayStatus,
    ).not.toHaveBeenCalled();
  });
});
