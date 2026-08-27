import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CheckoutModule } from './checkout/checkout.module';
import { validateEnv } from './config/env.schema';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';
import { ShippingModule } from './shipping/shipping.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    DatabaseModule,

    HealthModule,

    ProductsModule,

    CheckoutModule,

    ShippingModule,

    OrdersModule,

    PaymentsModule,
  ],
})
export class AppModule {}
