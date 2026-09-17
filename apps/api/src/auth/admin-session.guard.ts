import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminSessionService } from './admin-session.service';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly adminSessionService: AdminSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const token = parts[1];

    const admin = await this.adminSessionService.verifyToken(token);
    if (!admin) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach admin info to request for use in controllers
    (request as any).admin = admin;

    return true;
  }
}
