import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ADMIN_SESSION_HEADER,
  AdminSessionService,
} from './admin-session.service';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly adminSessionService: AdminSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionToken = request.headers[ADMIN_SESSION_HEADER];

    if (typeof sessionToken !== 'string') {
      throw new UnauthorizedException('Admin authentication is required.');
    }

    const admin =
      await this.adminSessionService.validateSessionToken(sessionToken);

    if (!admin) {
      throw new UnauthorizedException('Admin session is invalid or expired.');
    }

    Object.assign(request, { admin });

    return true;
  }
}
