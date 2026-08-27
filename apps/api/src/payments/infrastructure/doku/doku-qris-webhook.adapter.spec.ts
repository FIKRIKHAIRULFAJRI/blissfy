import {
  DokuQrisWebhookAdapter,
  DOKU_QRIS_WEBHOOK_PATH,
} from './doku-qris-webhook.adapter';

function createNotification(overrides: Record<string, unknown> = {}) {
  return {
    originalReferenceNo: 'DOKU-REF-001',

    originalPartnerReferenceNo: 'BLS-TEST-001',

    latestTransactionStatus: '00',

    transactionStatusDesc: 'Success',

    amount: {
      value: '169650.00',

      currency: 'IDR',
    },

    paidTime: '2026-08-27T15:00:00.000Z',

    ...overrides,
  };
}

describe('DokuQrisWebhookAdapter', () => {
  let signatureVerifierMock: {
    verify: jest.Mock;
  };

  let paymentStatusProcessorMock: {
    process: jest.Mock;
  };

  let adapter: DokuQrisWebhookAdapter;

  beforeEach(() => {
    signatureVerifierMock = {
      verify: jest.fn(),
    };

    paymentStatusProcessorMock = {
      process: jest.fn(),
    };

    adapter = new DokuQrisWebhookAdapter(
      signatureVerifierMock as never,

      paymentStatusProcessorMock as never,
    );
  });

  it('rejects the webhook before processing payment when signature verification fails', async () => {
    const signatureError = new Error('Invalid signature');

    signatureVerifierMock.verify.mockImplementation(() => {
      throw signatureError;
    });

    await expect(
      adapter.process({
        method: 'POST',

        authorization: 'Bearer token-test',

        timestamp: '2026-08-27T15:00:00Z',

        partnerId: 'client-id-test',

        signature: 'invalid-signature',

        body: createNotification(),
      }),
    ).rejects.toBe(signatureError);

    expect(signatureVerifierMock.verify).toHaveBeenCalledWith({
      method: 'POST',

      endpointPath: DOKU_QRIS_WEBHOOK_PATH,

      authorization: 'Bearer token-test',

      timestamp: '2026-08-27T15:00:00Z',

      partnerId: 'client-id-test',

      signature: 'invalid-signature',

      body: createNotification(),
    });

    expect(paymentStatusProcessorMock.process).not.toHaveBeenCalled();
  });

  it('rejects an invalid payload after signature verification without processing payment', async () => {
    const invalidBody = {
      latestTransactionStatus: '00',

      amount: {
        value: '169650.00',

        currency: 'IDR',
      },
    };

    await expect(
      adapter.process({
        method: 'POST',

        authorization: 'Bearer token-test',

        timestamp: '2026-08-27T15:00:00Z',

        partnerId: 'client-id-test',

        signature: 'valid-signature',

        body: invalidBody,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_DOKU_NOTIFICATION',
    });

    expect(signatureVerifierMock.verify).toHaveBeenCalledTimes(1);

    expect(paymentStatusProcessorMock.process).not.toHaveBeenCalled();
  });

  it('maps a successful DOKU notification to a paid payment status', async () => {
    const body = createNotification();

    paymentStatusProcessorMock.process.mockResolvedValue({
      orderNumber: 'BLS-TEST-001',

      action: 'FINALIZE_SALE',

      paymentStatus: 'PAID',

      reason: 'Payment completed.',
    });

    const result = await adapter.process({
      method: 'POST',

      authorization: 'Bearer token-test',

      timestamp: '2026-08-27T15:00:00Z',

      partnerId: 'client-id-test',

      signature: 'valid-signature',

      body,
    });

    expect(signatureVerifierMock.verify).toHaveBeenCalledWith({
      method: 'POST',

      endpointPath: DOKU_QRIS_WEBHOOK_PATH,

      authorization: 'Bearer token-test',

      timestamp: '2026-08-27T15:00:00Z',

      partnerId: 'client-id-test',

      signature: 'valid-signature',

      body,
    });

    expect(paymentStatusProcessorMock.process).toHaveBeenCalledWith({
      provider: 'doku',

      providerOrderId: 'BLS-TEST-001',

      providerTransactionId: 'DOKU-REF-001',

      amount: 169650,

      status: 'PAID',

      paidAt: '2026-08-27T15:00:00.000Z',

      rawResponse: body,
    });

    expect(result).toEqual({
      orderNumber: 'BLS-TEST-001',

      action: 'FINALIZE_SALE',

      paymentStatus: 'PAID',

      reason: 'Payment completed.',
    });
  });

  it('maps an unknown DOKU transaction status to requires review', async () => {
    const body = createNotification({
      latestTransactionStatus: '99',

      paidTime: undefined,
    });

    paymentStatusProcessorMock.process.mockResolvedValue({
      orderNumber: 'BLS-TEST-001',

      action: 'REQUIRES_REVIEW',

      paymentStatus: 'REQUIRES_REVIEW',

      reason: 'Unknown payment status.',
    });

    await adapter.process({
      method: 'POST',

      authorization: 'Bearer token-test',

      timestamp: '2026-08-27T15:00:00Z',

      partnerId: 'client-id-test',

      signature: 'valid-signature',

      body,
    });

    expect(paymentStatusProcessorMock.process).toHaveBeenCalledWith({
      provider: 'doku',

      providerOrderId: 'BLS-TEST-001',

      providerTransactionId: 'DOKU-REF-001',

      amount: 169650,

      status: 'REQUIRES_REVIEW',

      paidAt: null,

      rawResponse: body,
    });
  });
});
