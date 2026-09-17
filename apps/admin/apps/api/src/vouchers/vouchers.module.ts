import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AdminVouchersService } from './application/admin-vouchers.service';
import { AdminVouchersController } from './presentation/admin-vouchers.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AdminVouchersController],
  providers: [AdminVouchersService],
})
export class VouchersModule {}
