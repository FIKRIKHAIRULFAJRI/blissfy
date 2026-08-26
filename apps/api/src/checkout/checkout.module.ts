import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CheckoutService } from './application/checkout.service';
import { CheckoutRepository } from './infrastructure/checkout.repository';
import { CheckoutController } from './presentation/checkout.controller';

@Module({
  imports: [DatabaseModule, InventoryModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, CheckoutRepository],
})
export class CheckoutModule {}
