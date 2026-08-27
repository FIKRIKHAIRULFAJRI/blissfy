import { timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { createDokuSymmetricSignature } from './doku-signature';

export type VerifyDokuNotificationSignatureInput = {
  method: string;

  endpointPath: string;

  authorization: string;

  timestamp: string;

  partnerId: string;

  signature: string;

  body: unknown;
};

@Injectable()
export class DokuNotificationSignatureVerifier {
  constructor(private readonly configService: ConfigService) {}

  verify(input: VerifyDokuNotificationSignatureInput): void {
    const clientId = this.getRequiredConfig('DOKU_CLIENT_ID');

    const clientSecret = this.getRequiredConfig('DOKU_SECRET_KEY');

    const partnerId = input.partnerId.trim();

    if (!partnerId || partnerId !== clientId) {
      throw new DokuNotificationSignatureError(
        'INVALID_DOKU_PARTNER',

        'X-PARTNER-ID DOKU tidak valid.',
      );
    }

    const timestamp = input.timestamp.trim();

    if (!timestamp || Number.isNaN(new Date(timestamp).getTime())) {
      throw new DokuNotificationSignatureError(
        'INVALID_DOKU_TIMESTAMP',

        'X-TIMESTAMP DOKU tidak valid.',
      );
    }

    const accessToken = extractBearerToken(input.authorization);

    const endpointPath = normalizeEndpointPath(input.endpointPath);

    const requestBody = minifyRequestBody(input.body);

    const expectedSignature = createDokuSymmetricSignature({
      method: input.method,

      endpointPath,

      accessToken,

      requestBody,

      timestamp,

      clientSecret,
    });

    const receivedSignature = input.signature.trim();

    if (
      !receivedSignature ||
      !safeEqual(expectedSignature, receivedSignature)
    ) {
      throw new DokuNotificationSignatureError(
        'INVALID_DOKU_SIGNATURE',

        'X-SIGNATURE DOKU tidak valid.',
      );
    }
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      throw new DokuNotificationSignatureError(
        'DOKU_CONFIG_MISSING',

        `Konfigurasi ${key} belum tersedia.`,
      );
    }

    return value;
  }
}

function extractBearerToken(authorization: string): string {
  const match = authorization.trim().match(/^Bearer\s+(.+)$/i);

  const token = match?.[1]?.trim();

  if (!token) {
    throw new DokuNotificationSignatureError(
      'INVALID_DOKU_AUTHORIZATION',

      'Authorization DOKU tidak valid.',
    );
  }

  return token;
}

function normalizeEndpointPath(endpointPath: string): string {
  const value = endpointPath.trim();

  if (!value) {
    throw new DokuNotificationSignatureError(
      'INVALID_DOKU_ENDPOINT',

      'Endpoint notification DOKU tidak valid.',
    );
  }

  if (value.startsWith('/')) {
    return value;
  }

  return `/${value}`;
}

function minifyRequestBody(body: unknown): string {
  try {
    return JSON.stringify(body);
  } catch {
    throw new DokuNotificationSignatureError(
      'INVALID_DOKU_BODY',

      'Body notification DOKU tidak dapat diproses.',
    );
  }
}

function safeEqual(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'utf8');

  const receivedBuffer = Buffer.from(received, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export class DokuNotificationSignatureError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);

    this.name = 'DokuNotificationSignatureError';

    this.code = code;
  }
}
