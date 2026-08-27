import { hashSecret } from '../../orders/domain/hash';

import type { QrisPaymentResult } from '../domain/payment-gateway';

import type {
  PaymentAccessRow,
  PaymentsRepository,
} from '../infrastructure/payments.repository';

import { PaymentServiceError, PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const paymentsRepositoryMock = {
    findByAccessTokenHash: jest.fn(),

    updateFromQris: jest.fn(),

    expirePaymentAndReleaseReservations: jest.fn(),
  };

  const paymentGatewayMock = {
    createQrisPayment: jest.fn(),

    getPaymentStatus: jest.fn(),
  };

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PaymentsService(
      paymentsRepositoryMock as unknown as PaymentsRepository,

      paymentGatewayMock,
    );
  });

  it('should reject an unknown payment access token', async () => {
    paymentsRepositoryMock.findByAccessTokenHash.mockResolvedValue(null);

    try {
      await service.getPublicPaymentStateByToken('invalid-payment-token');

      throw new Error('Expected payment lookup to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(PaymentServiceError);

      const paymentError = error as PaymentServiceError;

      expect(paymentError.code).toBe('ORDER_NOT_FOUND');

      expect(paymentError.status).toBe(404);
    }

    expect(paymentsRepositoryMock.findByAccessTokenHash).toHaveBeenCalledWith(
      hashSecret('invalid-payment-token'),
    );

    expect(paymentGatewayMock.createQrisPayment).not.toHaveBeenCalled();
  });

  it('should return existing QRIS without creating another gateway payment', async () => {
    const paymentRow = createPaymentRow({
      provider: 'mock',

      providerOrderId: 'BLS-20260827-ABC12345',

      gatewayTransactionId: 'mock-BLS-20260827-ABC12345',

      qrImageUrl: 'data:image/svg+xml;base64,existing',

      qrString: 'MOCK-QRIS:BLS-20260827-ABC12345:195000',
    });

    paymentsRepositoryMock.findByAccessTokenHash.mockResolvedValue(paymentRow);

    const result = await service.createOrGetQrisPayment('payment-token-123');

    expect(result).toMatchObject({
      orderNumber: 'BLS-20260827-ABC12345',

      paymentStatus: 'PENDING',

      provider: 'mock',

      providerOrderId: 'BLS-20260827-ABC12345',

      qrString: 'MOCK-QRIS:BLS-20260827-ABC12345:195000',
    });

    expect(paymentGatewayMock.createQrisPayment).not.toHaveBeenCalled();

    expect(paymentsRepositoryMock.updateFromQris).not.toHaveBeenCalled();
  });

  it('should create QRIS through the payment gateway and persist the result', async () => {
    const paymentRow = createPaymentRow();

    const gatewayResult: QrisPaymentResult = {
      provider: 'mock',

      providerOrderId: paymentRow.orderNumber,

      providerTransactionId: `mock-${paymentRow.orderNumber}`,

      status: 'PENDING',

      amount: paymentRow.amount,

      qrImageUrl: 'data:image/svg+xml;base64,new',

      qrString: `MOCK-QRIS:${paymentRow.orderNumber}:${paymentRow.amount}`,

      expiresAt: paymentRow.paymentExpiresAt.toISOString(),

      rawResponse: {
        simulated: true,
      },
    };

    paymentsRepositoryMock.findByAccessTokenHash.mockResolvedValue(paymentRow);

    paymentGatewayMock.createQrisPayment.mockResolvedValue(gatewayResult);

    const result = await service.createOrGetQrisPayment('payment-token-123');

    expect(paymentGatewayMock.createQrisPayment).toHaveBeenCalledWith({
      orderNumber: paymentRow.orderNumber,

      amount: paymentRow.amount,

      expiresAt: paymentRow.paymentExpiresAt,

      customer: {
        name: paymentRow.recipientName,

        email: paymentRow.email,

        phone: paymentRow.whatsapp,
      },
    });

    expect(paymentsRepositoryMock.updateFromQris).toHaveBeenCalledWith(
      paymentRow.paymentId,
      gatewayResult,
    );

    expect(result).toMatchObject({
      paymentStatus: 'PENDING',

      provider: 'mock',

      qrString: gatewayResult.qrString,

      isPaymentGatewayConfigured: true,
    });
  });

  it('should expire payment and release reservations when checkout is expired', async () => {
    const expiredPayment = createPaymentRow({
      orderExpiresAt: new Date(Date.now() - 60_000),

      paymentExpiresAt: new Date(Date.now() - 60_000),
    });

    const refreshedPayment = createPaymentRow({
      orderPaymentStatus: 'EXPIRED',

      paymentStatus: 'EXPIRED',

      fulfillmentStatus: 'CANCELLED',

      orderExpiresAt: expiredPayment.orderExpiresAt,

      paymentExpiresAt: expiredPayment.paymentExpiresAt,
    });

    paymentsRepositoryMock.findByAccessTokenHash
      .mockResolvedValueOnce(expiredPayment)
      .mockResolvedValueOnce(refreshedPayment);

    paymentsRepositoryMock.expirePaymentAndReleaseReservations.mockResolvedValue(
      true,
    );

    const result = await service.createOrGetQrisPayment(
      'payment-token-expired',
    );

    expect(
      paymentsRepositoryMock.expirePaymentAndReleaseReservations,
    ).toHaveBeenCalledWith(expiredPayment.orderId, expiredPayment.paymentId);

    expect(result).toMatchObject({
      paymentStatus: 'EXPIRED',

      fulfillmentStatus: 'CANCELLED',
    });

    expect(paymentGatewayMock.createQrisPayment).not.toHaveBeenCalled();

    expect(paymentsRepositoryMock.updateFromQris).not.toHaveBeenCalled();
  });
});

function createPaymentRow(
  overrides: Partial<PaymentAccessRow> = {},
): PaymentAccessRow {
  return {
    orderId: 'order-id-1',

    orderNumber: 'BLS-20260827-ABC12345',

    accessTokenHash: hashSecret('payment-token-123'),

    orderPaymentStatus: 'PENDING',

    fulfillmentStatus: 'UNFULFILLED',

    totalPayment: 195000,

    orderExpiresAt: new Date(Date.now() + 10 * 60_000),

    recipientName: 'Fikri Khairul',

    email: 'fikri@example.com',

    whatsapp: '081234567890',

    paymentId: 'payment-id-1',

    provider: null,

    providerOrderId: null,

    gatewayTransactionId: null,

    paymentStatus: 'PENDING',

    amount: 195000,

    qrImageUrl: null,

    qrString: null,

    paidAt: null,

    paymentExpiresAt: new Date(Date.now() + 10 * 60_000),

    ...overrides,
  };
}
