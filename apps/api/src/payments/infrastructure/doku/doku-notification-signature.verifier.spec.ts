import { createDokuSymmetricSignature } from './doku-signature';

import {
  DokuNotificationSignatureError,
  DokuNotificationSignatureVerifier,
} from './doku-notification-signature.verifier';

const CLIENT_ID = 'test-client-id';

const CLIENT_SECRET = 'test-client-secret';

const ACCESS_TOKEN = 'notification-access-token';

const TIMESTAMP = '2026-08-27T16:00:00Z';

const ENDPOINT_PATH = '/v1/payments/webhooks/doku/qris';

function createBody() {
  return {
    originalReferenceNo: 'DOKU-REF-001',

    originalPartnerReferenceNo: 'BLS-TEST-001',

    latestTransactionStatus: '00',

    amount: {
      value: '169650',

      currency: 'IDR',
    },
  };
}

function createSignature(body: unknown) {
  return createDokuSymmetricSignature({
    method: 'POST',

    endpointPath: ENDPOINT_PATH,

    accessToken: ACCESS_TOKEN,

    requestBody: JSON.stringify(body),

    timestamp: TIMESTAMP,

    clientSecret: CLIENT_SECRET,
  });
}

describe('DokuNotificationSignatureVerifier', () => {
  let verifier: DokuNotificationSignatureVerifier;

  beforeEach(() => {
    const configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'DOKU_CLIENT_ID') {
          return CLIENT_ID;
        }

        if (key === 'DOKU_SECRET_KEY') {
          return CLIENT_SECRET;
        }

        return undefined;
      }),
    };

    verifier = new DokuNotificationSignatureVerifier(
      configServiceMock as never,
    );
  });

  it('accepts a valid DOKU notification signature', () => {
    const body = createBody();

    const signature = createSignature(body);

    expect(() =>
      verifier.verify({
        method: 'POST',

        endpointPath: ENDPOINT_PATH,

        authorization: `Bearer ${ACCESS_TOKEN}`,

        timestamp: TIMESTAMP,

        partnerId: CLIENT_ID,

        signature,

        body,
      }),
    ).not.toThrow();
  });

  it('rejects the notification when the request body was modified', () => {
    const originalBody = createBody();

    const signature = createSignature(originalBody);

    const modifiedBody = {
      ...originalBody,

      amount: {
        value: '1',

        currency: 'IDR',
      },
    };

    expect(() =>
      verifier.verify({
        method: 'POST',

        endpointPath: ENDPOINT_PATH,

        authorization: `Bearer ${ACCESS_TOKEN}`,

        timestamp: TIMESTAMP,

        partnerId: CLIENT_ID,

        signature,

        body: modifiedBody,
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'INVALID_DOKU_SIGNATURE',
      }) as DokuNotificationSignatureError,
    );
  });

  it('rejects a notification from an unexpected partner', () => {
    const body = createBody();

    const signature = createSignature(body);

    expect(() =>
      verifier.verify({
        method: 'POST',

        endpointPath: ENDPOINT_PATH,

        authorization: `Bearer ${ACCESS_TOKEN}`,

        timestamp: TIMESTAMP,

        partnerId: 'wrong-client-id',

        signature,

        body,
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'INVALID_DOKU_PARTNER',
      }) as DokuNotificationSignatureError,
    );
  });

  it('rejects a notification with invalid authorization', () => {
    const body = createBody();

    const signature = createSignature(body);

    expect(() =>
      verifier.verify({
        method: 'POST',

        endpointPath: ENDPOINT_PATH,

        authorization: 'invalid-token',

        timestamp: TIMESTAMP,

        partnerId: CLIENT_ID,

        signature,

        body,
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'INVALID_DOKU_AUTHORIZATION',
      }) as DokuNotificationSignatureError,
    );
  });
});
