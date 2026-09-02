import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { AdminSessionGuard } from './admin-session.guard';
import {
  ADMIN_SESSION_HEADER,
  AdminSessionService,
} from './admin-session.service';

describe('AdminSessionGuard', () => {
  const adminSessionService = {
    validateSessionToken: jest.fn(),
  };
  const guard = new AdminSessionGuard(
    adminSessionService as unknown as AdminSessionService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function contextWithHeaders(headers: Record<string, string>) {
    const request = { headers };

    return {
      context: {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as unknown as ExecutionContext,
      request,
    };
  }

  it('rejects an unauthenticated image mutation request', async () => {
    const { context } = contextWithHeaders({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(adminSessionService.validateSessionToken).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired Admin session', async () => {
    adminSessionService.validateSessionToken.mockResolvedValue(null);
    const { context } = contextWithHeaders({
      [ADMIN_SESSION_HEADER]: 'invalid-session',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('accepts a valid existing Admin session and attaches its identity', async () => {
    const admin = {
      id: 'admin-1',
      email: 'admin@example.test',
      displayName: 'Admin',
    };
    adminSessionService.validateSessionToken.mockResolvedValue(admin);
    const { context, request } = contextWithHeaders({
      [ADMIN_SESSION_HEADER]: 'valid-session',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request).toMatchObject({ admin });
  });
});
