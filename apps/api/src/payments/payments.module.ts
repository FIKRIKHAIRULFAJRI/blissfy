import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DatabaseModule } from '../database/database.module';

import { PaymentStatusProcessorService } from './application/payment-status-processor.service';
import { PaymentsService } from './application/payments.service';

import { PAYMENT_GATEWAY, type PaymentGateway } from './domain/payment-gateway';

import { DokuAuthClient } from './infrastructure/doku/doku-auth.client';

import { DokuNotificationSignatureVerifier } from './infrastructure/doku/doku-notification-signature.verifier';

import { DokuPaymentGateway } from './infrastructure/doku/doku-payment.gateway';

import { DokuQrisClient } from './infrastructure/doku/doku-qris.client';

import { DokuQrisWebhookAdapter } from './infrastructure/doku/doku-qris-webhook.adapter';

import { MockPaymentGateway } from './infrastructure/mock/mock-payment.gateway';

import { PaymentNotificationRepository } from './infrastructure/payment-notification.repository';

import { PaymentSettlementRepository } from './infrastructure/payment-settlement.repository';

import { PaymentsRepository } from './infrastructure/payments.repository';

import { DokuQrisWebhookController } from './presentation/doku-qris-webhook.controller';

import { PaymentsController } from './presentation/payments.controller';

@Module({
  imports: [DatabaseModule],

  controllers: [PaymentsController, DokuQrisWebhookController],

  providers: [
    DokuAuthClient,

    DokuQrisClient,

    DokuPaymentGateway,

    DokuNotificationSignatureVerifier,

    DokuQrisWebhookAdapter,

    MockPaymentGateway,

    PaymentsRepository,

    PaymentNotificationRepository,

    PaymentSettlementRepository,

    PaymentStatusProcessorService,

    PaymentsService,

    {
      provide: PAYMENT_GATEWAY,

      inject: [ConfigService, MockPaymentGateway, DokuPaymentGateway],

      useFactory: (
        configService: ConfigService,

        mockPaymentGateway: MockPaymentGateway,

        dokuPaymentGateway: DokuPaymentGateway,
      ): PaymentGateway => {
        const mode =
          configService.get<string>('PAYMENT_GATEWAY_MODE') ?? 'mock';

        if (mode === 'doku') {
          return dokuPaymentGateway;
        }

        return mockPaymentGateway;
      },
    },
  ],

  exports: [
    PAYMENT_GATEWAY,

    DokuAuthClient,

    DokuQrisClient,

    DokuPaymentGateway,

    DokuNotificationSignatureVerifier,

    DokuQrisWebhookAdapter,

    PaymentsRepository,

    PaymentNotificationRepository,

    PaymentSettlementRepository,

    PaymentStatusProcessorService,

    PaymentsService,
  ],
})
export class PaymentsModule {}
