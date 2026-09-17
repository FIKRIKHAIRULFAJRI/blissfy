import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { CloudinaryService } from './infrastructure/cloudinary.service';
import { UploadsController } from './presentation/uploads.controller';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [UploadsController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadsModule {}
