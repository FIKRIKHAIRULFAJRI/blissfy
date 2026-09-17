import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { InventoryModule } from '../inventory/inventory.module';

import { AdminOrdersService } from './application/admin-orders.service';
import { OrderMaintenanceService } from './application/order-maintenance.service';
import { OrderSnapshotService } from './application/order-snapshot.service';
import { OrdersService } from './application/orders.service';

import { OrderMaintenanceRepository } from './infrastructure/order-maintenance.repository';
import { OrderRepository } from './infrastructure/order.repository';

import { AdminOrdersController } from './presentation/admin-orders.controller';
import { OrdersController } from './presentation/orders.controller';

@Module({
  imports: [DatabaseModule, InventoryModule, AuthModule],

  controllers: [OrdersController, AdminOrdersController],

  providers: [
    OrdersService,
    AdminOrdersService,
    OrderSnapshotService,
    OrderMaintenanceService,
    OrderRepository,
    OrderMaintenanceRepository,
  ],
})
export class OrdersModule {}
