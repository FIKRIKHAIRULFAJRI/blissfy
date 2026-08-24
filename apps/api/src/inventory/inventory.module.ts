import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InventoryService } from './application/inventory.service';
import { InventoryRepository } from './infrastructure/inventory.repository';

@Module({
  imports: [DatabaseModule],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService],
})
export class InventoryModule {}
