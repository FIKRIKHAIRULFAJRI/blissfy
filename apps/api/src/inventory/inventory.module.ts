import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { InventoryService } from './application/inventory.service';
import { InventoryRepository } from './infrastructure/inventory.repository';
import { AdminInventoryController } from './presentation/admin-inventory.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AdminInventoryController],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService],
})
export class InventoryModule {}
