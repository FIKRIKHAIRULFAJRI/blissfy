import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DatabaseModule } from '../database/database.module';

import { PaymentsService } from './application/payments.service';

import { PAYMENT_GATEWAY, type PaymentGateway } from './domain/payment-gateway';

import { DokuAuthClient } from './infrastructure/doku/doku-auth.client';

import { MockPaymentGateway } from './infrastructure/mock/mock-payment.gateway';

import { PaymentsRepository } from './infrastructure/payments.repository';

import { PaymentsController } from './presentation/payments.controller';

@Module({
  imports: [DatabaseModule],

  controllers: [PaymentsController],

  providers: [
    DokuAuthClient,

    MockPaymentGateway,

    PaymentsRepository,

    PaymentsService,

    {
      provide: PAYMENT_GATEWAY,

      inject: [ConfigService, MockPaymentGateway],

      useFactory: (
        configService: ConfigService,
        mockPaymentGateway: MockPaymentGateway,
      ): PaymentGateway => {
        const mode =
          configService.get<string>('PAYMENT_GATEWAY_MODE') ?? 'mock';

        if (mode === 'mock') {
          return mockPaymentGateway;
        }

        throw new Error(
          'DOKU payment gateway adapter belum tersedia. Gunakan PAYMENT_GATEWAY_MODE=mock.',
        );
      },
    },
  ],

  exports: [
    PAYMENT_GATEWAY,

    DokuAuthClient,

    PaymentsRepository,

    PaymentsService,
  ],
})
export class PaymentsModule {}
