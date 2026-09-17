import { Module } from '@nestjs/common';
import { AdminSessionService } from './admin-session.service';
import { AdminSessionGuard } from './admin-session.guard';

@Module({
  providers: [AdminSessionService, AdminSessionGuard],
  exports: [AdminSessionService, AdminSessionGuard],
})
export class AuthModule {}
