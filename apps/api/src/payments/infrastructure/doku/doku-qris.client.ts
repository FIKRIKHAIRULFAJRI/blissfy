import { randomInt } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DokuAuthClient } from './doku-auth.client';

import {
  createDokuSymmetricSignature,
  createDokuTimestamp,
} from './doku-signature';

const generateQrisPath = '/snap-adapter/b2b/v1.0/qr/qr-mpm-generate';

const queryQrisPath = '/snap-adapter/b2b/v1.0/qr/qr-mpm-query';

type DokuAmount = {
  value: string;
  currency: 'IDR';
};

type DokuGenerateQrisResponse = {
  responseCode?: string;

  responseMessage?: string;

  referenceNo?: string;

  partnerReferenceNo?: string;

  qrContent?: string;

  terminalId?: string;

  additionalInfo?: Record<string, unknown>;
};

type DokuQueryQrisResponse = {
  responseCode?: string;

  responseMessage?: string;

  originalReferenceNo?: string;

  originalPartnerReferenceNo?: string;

  serviceCode?: string;

  latestTransactionStatus?: string;

  transactionStatusDesc?: string;

  paidTime?: string;

  amount?: DokuAmount;

  feeAmount?: DokuAmount;

  additionalInfo?: Record<string, unknown>;
};

export type GenerateDokuQrisInput = {
  partnerReferenceNo: string;

  amount: number;

  expiresAt: Date;

  additionalInfo?: Record<string, unknown>;
};

export type GenerateDokuQrisResult = {
  responseCode: string | null;

  responseMessage: string | null;

  referenceNo: string;

  partnerReferenceNo: string;

  qrContent: string;

  terminalId: string | null;

  rawResponse: Record<string, unknown>;
};

export type QueryDokuQrisInput = {
  originalReferenceNo: string;

  originalPartnerReferenceNo: string;
};

export type QueryDokuQrisResult = {
  responseCode: string | null;

  responseMessage: string | null;

  originalReferenceNo: string;

  originalPartnerReferenceNo: string;

  latestTransactionStatus: string | null;

  transactionStatusDesc: string | null;

  paidTime: string | null;

  rawResponse: Record<string, unknown>;
};

@Injectable()
export class DokuQrisClient {
  constructor(
    private readonly configService: ConfigService,

    private readonly dokuAuthClient: DokuAuthClient,
  ) {}

  async generateQris(
    input: GenerateDokuQrisInput,
  ): Promise<GenerateDokuQrisResult> {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new DokuQrisError({
        status: 400,

        responseCode: null,

        responseMessage: 'Nominal QRIS tidak valid.',
      });
    }

    const merchantId = this.getRequiredConfig('DOKU_MERCHANT_ID');

    const terminalId = this.getRequiredConfig('DOKU_TERMINAL_ID');

    const body = {
      partnerReferenceNo: input.partnerReferenceNo,

      amount: {
        value: input.amount.toFixed(2),

        currency: 'IDR',
      },

      merchantId,

      terminalId,

      validityPeriod: toJakartaIso8601(input.expiresAt),

      additionalInfo: input.additionalInfo ?? {},
    };

    const response = await this.postSnap<DokuGenerateQrisResponse>(
      generateQrisPath,
      body,
    );

    if (!response.referenceNo || !response.qrContent) {
      throw new DokuQrisError({
        status: 502,

        responseCode: response.responseCode ?? null,

        responseMessage:
          response.responseMessage ??
          'DOKU tidak mengembalikan QRIS yang valid.',
      });
    }

    return {
      responseCode: response.responseCode ?? null,

      responseMessage: response.responseMessage ?? null,

      referenceNo: response.referenceNo,

      partnerReferenceNo:
        response.partnerReferenceNo ?? input.partnerReferenceNo,

      qrContent: response.qrContent,

      terminalId: response.terminalId ?? null,

      rawResponse: response,
    };
  }

  async queryQris(input: QueryDokuQrisInput): Promise<QueryDokuQrisResult> {
    const merchantId = this.getRequiredConfig('DOKU_MERCHANT_ID');

    const body = {
      originalReferenceNo: input.originalReferenceNo,

      originalPartnerReferenceNo: input.originalPartnerReferenceNo,

      serviceCode: '47',

      merchantId,
    };

    const response = await this.postSnap<DokuQueryQrisResponse>(
      queryQrisPath,
      body,
    );

    return {
      responseCode: response.responseCode ?? null,

      responseMessage: response.responseMessage ?? null,

      originalReferenceNo:
        response.originalReferenceNo ?? input.originalReferenceNo,

      originalPartnerReferenceNo:
        response.originalPartnerReferenceNo ?? input.originalPartnerReferenceNo,

      latestTransactionStatus: response.latestTransactionStatus ?? null,

      transactionStatusDesc: response.transactionStatusDesc ?? null,

      paidTime: response.paidTime ?? null,

      rawResponse: response,
    };
  }

  private async postSnap<T extends Record<string, unknown>>(
    endpointPath: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const baseUrl = this.getRequiredConfig('DOKU_BASE_URL');

    const clientId = this.getRequiredConfig('DOKU_CLIENT_ID');

    const clientSecret = this.getRequiredConfig('DOKU_SECRET_KEY');

    const token = await this.dokuAuthClient.getB2bToken();

    const timestamp = createDokuTimestamp();

    const requestBody = JSON.stringify(body);

    const signature = createDokuSymmetricSignature({
      method: 'POST',

      endpointPath,

      accessToken: token.accessToken,

      requestBody,

      timestamp,

      clientSecret,
    });

    const response = await fetch(`${baseUrl}${endpointPath}`, {
      method: 'POST',

      headers: {
        Accept: 'application/json',

        'Content-Type': 'application/json',

        Authorization: `${token.tokenType} ${token.accessToken}`,

        'X-PARTNER-ID': clientId,

        'X-EXTERNAL-ID': createExternalId(),

        'X-TIMESTAMP': timestamp,

        'X-SIGNATURE': signature,

        'CHANNEL-ID': 'H2H',
      },

      body: requestBody,
    });

    const text = await response.text();

    const parsed = parseJson(text);

    if (!response.ok) {
      throw new DokuQrisError({
        status: response.status,

        responseCode:
          typeof parsed.responseCode === 'string' ? parsed.responseCode : null,

        responseMessage:
          typeof parsed.responseMessage === 'string'
            ? parsed.responseMessage
            : 'DOKU QRIS request failed.',
      });
    }

    return parsed as T;
  }

  private getRequiredConfig(key: string) {
    const value = this.configService.get<string>(key);

    if (!value?.trim()) {
      throw new DokuQrisError({
        status: 503,

        responseCode: null,

        responseMessage: `${key} belum dikonfigurasi.`,
      });
    }

    return value.trim();
  }
}

function createExternalId() {
  const timestamp = Date.now().toString();

  const random = randomInt(100000, 1000000).toString();

  return `${timestamp}${random}`;
}

function toJakartaIso8601(date: Date) {
  const jakartaOffsetMs = 7 * 60 * 60 * 1000;

  return new Date(date.getTime() + jakartaOffsetMs)
    .toISOString()
    .replace(/\.\d{3}Z$/, '+07:00');
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

export class DokuQrisError extends Error {
  status: number;

  responseCode: string | null;

  constructor(input: {
    status: number;

    responseCode: string | null;

    responseMessage: string;
  }) {
    super(input.responseMessage);

    this.name = 'DokuQrisError';

    this.status = input.status;

    this.responseCode = input.responseCode;
  }
}
