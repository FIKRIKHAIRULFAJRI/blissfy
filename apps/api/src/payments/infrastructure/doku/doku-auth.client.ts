import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createDokuB2bSignature, createDokuTimestamp } from './doku-signature';

type DokuB2bTokenResponse = {
  responseCode?: string;
  responseMessage?: string;
  accessToken?: string;
  tokenType?: string;
  expiresIn?: string | number;
  additionalInfo?: unknown;
};

export type DokuB2bToken = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  responseCode: string | null;
};

@Injectable()
export class DokuAuthClient {
  constructor(private readonly configService: ConfigService) {}

  async getB2bToken(): Promise<DokuB2bToken> {
    const baseUrl = this.getRequiredConfig('DOKU_BASE_URL');

    const clientId = this.getRequiredConfig('DOKU_CLIENT_ID');

    const privateKeyPath = this.getRequiredConfig('DOKU_PRIVATE_KEY_PATH');

    const privateKey = readFileSync(privateKeyPath, 'utf8');

    const timestamp = createDokuTimestamp();

    const signature = createDokuB2bSignature({
      clientId,
      timestamp,
      privateKey,
    });

    const response = await fetch(
      `${baseUrl}/authorization/v1/access-token/b2b`,
      {
        method: 'POST',

        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CLIENT-KEY': clientId,
          'X-TIMESTAMP': timestamp,
          'X-SIGNATURE': signature,
        },

        body: JSON.stringify({
          grantType: 'client_credentials',
        }),
      },
    );

    const text = await response.text();

    const body = parseJson(text) as DokuB2bTokenResponse;

    if (!response.ok || !body.accessToken) {
      throw new DokuAuthError({
        status: response.status,
        responseCode: body.responseCode ?? null,
        responseMessage: body.responseMessage ?? 'DOKU authentication failed.',
      });
    }

    const expiresIn = Number(body.expiresIn ?? 900);

    return {
      accessToken: body.accessToken,

      tokenType: body.tokenType ?? 'Bearer',

      expiresIn: Number.isFinite(expiresIn) ? expiresIn : 900,

      responseCode: body.responseCode ?? null,
    };
  }

  private getRequiredConfig(key: string) {
    const value = this.configService.get<string>(key);

    if (!value?.trim()) {
      throw new DokuAuthError({
        status: 503,
        responseCode: null,
        responseMessage: `${key} belum dikonfigurasi.`,
      });
    }

    return value.trim();
  }
}

function parseJson(value: string): Record<string, unknown> {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export class DokuAuthError extends Error {
  status: number;
  responseCode: string | null;

  constructor(input: {
    status: number;
    responseCode: string | null;
    responseMessage: string;
  }) {
    super(input.responseMessage);

    this.name = 'DokuAuthError';
    this.status = input.status;
    this.responseCode = input.responseCode;
  }
}
