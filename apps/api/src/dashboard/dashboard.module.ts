import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AdminDashboardService } from './application/admin-dashboard.service';
import { AdminDashboardController } from './presentation/admin-dashboard.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class DashboardModule {}
