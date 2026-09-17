import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { HomepageService } from './application/homepage.service';
import { AdminHomepageController } from './presentation/admin-homepage.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AdminHomepageController],
  providers: [HomepageService],
})
export class HomepageModule {}
