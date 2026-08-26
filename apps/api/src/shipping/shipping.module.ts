import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ShippingService } from './application/shipping.service';
import { SHIPPING_PROVIDER } from './domain/shipping-provider';
import { RajaOngkirProvider } from './infrastructure/rajaongkir.provider';
import { ShippingRepository } from './infrastructure/shipping.repository';
import { ShippingController } from './presentation/shipping.controller';

@Module({
  imports: [DatabaseModule, InventoryModule],

  controllers: [ShippingController],

  providers: [
    ShippingService,
    ShippingRepository,
    RajaOngkirProvider,
    {
      provide: SHIPPING_PROVIDER,
      useExisting: RajaOngkirProvider,
    },
  ],

  exports: [ShippingService],
})
export class ShippingModule {}
