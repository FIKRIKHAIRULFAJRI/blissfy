import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AdminFlashSalesService } from './application/admin-flash-sales.service';
import { AdminFlashSalesController } from './presentation/admin-flash-sales.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AdminFlashSalesController],
  providers: [AdminFlashSalesService],
})
export class FlashSalesModule {}
