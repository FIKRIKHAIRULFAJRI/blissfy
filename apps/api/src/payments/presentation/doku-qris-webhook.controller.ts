import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PaymentStatusProcessorError } from '../application/payment-status-processor.service';

import { DokuQrisNotificationError } from '../infrastructure/doku/doku-qris-notification.schema';

import { DokuNotificationSignatureError } from '../infrastructure/doku/doku-notification-signature.verifier';

import {
  DOKU_QRIS_WEBHOOK_ROUTE,
  DokuQrisWebhookAdapter,
} from '../infrastructure/doku/doku-qris-webhook.adapter';

@ApiTags('Payment Webhooks')
@Controller()
export class DokuQrisWebhookController {
  constructor(private readonly webhookAdapter: DokuQrisWebhookAdapter) {}

  @Post(DOKU_QRIS_WEBHOOK_ROUTE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive DOKU QRIS SNAP payment notification',
  })
  @ApiHeader({
    name: 'Authorization',

    required: true,
  })
  @ApiHeader({
    name: 'X-TIMESTAMP',

    required: true,
  })
  @ApiHeader({
    name: 'X-PARTNER-ID',

    required: true,
  })
  @ApiHeader({
    name: 'X-SIGNATURE',

    required: true,
  })
  @ApiResponse({
    status: 200,

    description: 'DOKU QRIS notification processed.',
  })
  async notify(
    @Headers('authorization')
    authorization: string | undefined,

    @Headers('x-timestamp')
    timestamp: string | undefined,

    @Headers('x-partner-id')
    partnerId: string | undefined,

    @Headers('x-signature')
    signature: string | undefined,

    @Body()
    body: unknown,
  ) {
    try {
      await this.webhookAdapter.process({
        method: 'POST',

        authorization: authorization ?? '',

        timestamp: timestamp ?? '',

        partnerId: partnerId ?? '',

        signature: signature ?? '',

        body,
      });

      return {
        responseCode: '2005200',

        responseMessage: 'Successful',
      };
    } catch (error) {
      handleDokuWebhookError(error);
    }
  }
}

function handleDokuWebhookError(error: unknown): never {
  if (error instanceof DokuNotificationSignatureError) {
    if (error.code === 'DOKU_CONFIG_MISSING') {
      throw createSnapException(
        HttpStatus.INTERNAL_SERVER_ERROR,

        '5005200',

        'General Error',
      );
    }

    throw createSnapException(
      HttpStatus.UNAUTHORIZED,

      '4015200',

      'Unauthorized Signature',
    );
  }

  if (error instanceof DokuQrisNotificationError) {
    throw createSnapException(
      HttpStatus.BAD_REQUEST,

      '4005201',

      'Invalid Field Format',
    );
  }

  if (error instanceof PaymentStatusProcessorError) {
    if (error.code === 'PAYMENT_AMOUNT_MISMATCH') {
      throw createSnapException(
        HttpStatus.CONFLICT,

        '4095200',

        'Conflict',
      );
    }

    if (error.code === 'PAYMENT_NOT_FOUND') {
      throw createSnapException(
        HttpStatus.NOT_FOUND,

        '4045200',

        'Payment Not Found',
      );
    }

    throw createSnapException(
      HttpStatus.BAD_REQUEST,

      '4005201',

      'Invalid Field Format',
    );
  }

  console.error('DOKU QRIS webhook failed', {
    name: error instanceof Error ? error.name : 'UnknownError',
  });

  throw createSnapException(
    HttpStatus.INTERNAL_SERVER_ERROR,

    '5005200',

    'General Error',
  );
}

function createSnapException(
  status: HttpStatus,

  responseCode: string,

  responseMessage: string,
): HttpException {
  return new HttpException(
    {
      responseCode,

      responseMessage,
    },

    status,
  );
}
