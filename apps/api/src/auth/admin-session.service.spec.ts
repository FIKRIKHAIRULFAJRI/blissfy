import { createHmac } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { AdminSessionService } from './admin-session.service';

describe('AdminSessionService', () => {
  const database = {
    query: jest.fn(),
  };
  const service = new AdminSessionService(
    database as unknown as DatabaseService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates the existing Store Admin session signature format', async () => {
    const passwordHash = 'stored-password-hash';
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const payload = `admin-1.${expiresAt}`;
    const signature = createHmac('sha256', passwordHash)
      .update(payload)
      .digest('base64url');
    database.query.mockResolvedValue({
      rows: [
        {
          id: 'admin-1',
          email: 'admin@example.test',
          displayName: 'Admin',
          password: passwordHash,
        },
      ],
    });

    await expect(
      service.validateSessionToken(`${payload}.${signature}`),
    ).resolves.toEqual({
      id: 'admin-1',
      email: 'admin@example.test',
      displayName: 'Admin',
    });
  });

  it('rejects expired sessions before querying Admin credentials', async () => {
    const expiresAt = Math.floor(Date.now() / 1000) - 1;

    await expect(
      service.validateSessionToken(`admin-1.${expiresAt}.signature`),
    ).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });

  it('rejects a tampered signature', async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    database.query.mockResolvedValue({
      rows: [
        {
          id: 'admin-1',
          email: 'admin@example.test',
          displayName: null,
          password: 'stored-password-hash',
        },
      ],
    });

    await expect(
      service.validateSessionToken(`admin-1.${expiresAt}.tampered-signature`),
    ).resolves.toBeNull();
  });
});
