import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { InventoryModule } from '../inventory/inventory.module';

import { OrderMaintenanceService } from './application/order-maintenance.service';
import { OrderSnapshotService } from './application/order-snapshot.service';
import { OrdersService } from './application/orders.service';

import { OrderMaintenanceRepository } from './infrastructure/order-maintenance.repository';
import { OrderRepository } from './infrastructure/order.repository';

import { OrdersController } from './presentation/orders.controller';

@Module({
  imports: [DatabaseModule, InventoryModule],

  controllers: [OrdersController],

  providers: [
    OrdersService,
    OrderSnapshotService,
    OrderMaintenanceService,
    OrderRepository,
    OrderMaintenanceRepository,
  ],
})
export class OrdersModule {}
