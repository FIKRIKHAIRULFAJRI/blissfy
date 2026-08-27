import { HttpException, HttpStatus } from '@nestjs/common';

import { PaymentStatusProcessorError } from '../application/payment-status-processor.service';

import { DokuQrisNotificationError } from '../infrastructure/doku/doku-qris-notification.schema';

import { DokuNotificationSignatureError } from '../infrastructure/doku/doku-notification-signature.verifier';

import { DokuQrisWebhookController } from './doku-qris-webhook.controller';

function createBody() {
  return {
    originalReferenceNo: 'DOKU-REF-001',

    originalPartnerReferenceNo: 'BLS-TEST-001',

    latestTransactionStatus: '00',

    amount: {
      value: '169650.00',

      currency: 'IDR',
    },
  };
}

async function expectHttpException(
  promise: Promise<unknown>,
  expectedStatus: number,
  expectedResponse: Record<string, unknown>,
) {
  let caughtError: unknown;

  try {
    await promise;
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(HttpException);

  const httpException = caughtError as HttpException;

  expect(httpException.getStatus()).toBe(expectedStatus);

  expect(httpException.getResponse()).toEqual(expectedResponse);
}

describe('DokuQrisWebhookController', () => {
  let webhookAdapterMock: {
    process: jest.Mock;
  };

  let controller: DokuQrisWebhookController;

  beforeEach(() => {
    webhookAdapterMock = {
      process: jest.fn(),
    };

    controller = new DokuQrisWebhookController(webhookAdapterMock as never);
  });

  it('returns SNAP success response when notification is processed', async () => {
    webhookAdapterMock.process.mockResolvedValue({
      orderNumber: 'BLS-TEST-001',

      action: 'FINALIZE_SALE',

      paymentStatus: 'PAID',

      reason: 'Payment completed.',
    });

    const body = createBody();

    const result = await controller.notify(
      'Bearer token-test',

      '2026-08-28T01:00:00Z',

      'client-id-test',

      'signature-test',

      body,
    );

    expect(webhookAdapterMock.process).toHaveBeenCalledWith({
      method: 'POST',

      authorization: 'Bearer token-test',

      timestamp: '2026-08-28T01:00:00Z',

      partnerId: 'client-id-test',

      signature: 'signature-test',

      body,
    });

    expect(result).toEqual({
      responseCode: '2005200',

      responseMessage: 'Successful',
    });
  });

  it('returns 4015200 when DOKU signature is invalid', async () => {
    webhookAdapterMock.process.mockRejectedValue(
      new DokuNotificationSignatureError(
        'INVALID_DOKU_SIGNATURE',

        'Invalid signature.',
      ),
    );

    await expectHttpException(
      controller.notify(
        'Bearer token-test',

        '2026-08-28T01:00:00Z',

        'client-id-test',

        'invalid-signature',

        createBody(),
      ),

      HttpStatus.UNAUTHORIZED,

      {
        responseCode: '4015200',

        responseMessage: 'Unauthorized Signature',
      },
    );
  });

  it('returns 4005201 when DOKU payload is invalid', async () => {
    webhookAdapterMock.process.mockRejectedValue(
      new DokuQrisNotificationError(
        'INVALID_DOKU_NOTIFICATION',

        'Invalid payload.',
      ),
    );

    await expectHttpException(
      controller.notify(
        'Bearer token-test',

        '2026-08-28T01:00:00Z',

        'client-id-test',

        'signature-test',

        {},
      ),

      HttpStatus.BAD_REQUEST,

      {
        responseCode: '4005201',

        responseMessage: 'Invalid Field Format',
      },
    );
  });

  it('returns conflict when payment amount does not match', async () => {
    webhookAdapterMock.process.mockRejectedValue(
      new PaymentStatusProcessorError(
        'PAYMENT_AMOUNT_MISMATCH',

        'Payment amount mismatch.',

        409,
      ),
    );

    await expectHttpException(
      controller.notify(
        'Bearer token-test',

        '2026-08-28T01:00:00Z',

        'client-id-test',

        'signature-test',

        createBody(),
      ),

      HttpStatus.CONFLICT,

      {
        responseCode: '4095200',

        responseMessage: 'Conflict',
      },
    );
  });

  it('returns 4045200 when referenced payment does not exist', async () => {
    webhookAdapterMock.process.mockRejectedValue(
      new PaymentStatusProcessorError(
        'PAYMENT_NOT_FOUND',

        'Payment not found.',

        404,
      ),
    );

    await expectHttpException(
      controller.notify(
        'Bearer token-test',

        '2026-08-28T01:00:00Z',

        'client-id-test',

        'signature-test',

        createBody(),
      ),

      HttpStatus.NOT_FOUND,

      {
        responseCode: '4045200',

        responseMessage: 'Payment Not Found',
      },
    );
  });

  it('returns general error when DOKU configuration is missing', async () => {
    webhookAdapterMock.process.mockRejectedValue(
      new DokuNotificationSignatureError(
        'DOKU_CONFIG_MISSING',

        'DOKU configuration missing.',
      ),
    );

    await expectHttpException(
      controller.notify(
        'Bearer token-test',

        '2026-08-28T01:00:00Z',

        'client-id-test',

        'signature-test',

        createBody(),
      ),

      HttpStatus.INTERNAL_SERVER_ERROR,

      {
        responseCode: '5005200',

        responseMessage: 'General Error',
      },
    );
  });
});
