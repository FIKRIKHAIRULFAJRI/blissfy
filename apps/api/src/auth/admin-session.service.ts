import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export const ADMIN_SESSION_HEADER = 'x-blissfy-admin-session';

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  displayName: string | null;
};

@Injectable()
export class AdminSessionService {
  constructor(private readonly database: DatabaseService) {}

  async validateSessionToken(
    sessionToken: string,
  ): Promise<AuthenticatedAdmin | null> {
    const [adminId, expiresAtRaw, signature, ...unexpected] =
      sessionToken.split('.');
    const expiresAt = Number(expiresAtRaw);

    if (
      unexpected.length > 0 ||
      !adminId ||
      !Number.isInteger(expiresAt) ||
      !signature ||
      expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    const result = await this.database.query<
      AuthenticatedAdmin & { password: string | null }
    >(
      `
        SELECT
          id::text AS id,
          email,
          "displayName",
          password
        FROM admin_users
        WHERE id::text = $1
        LIMIT 1
      `,
      [adminId],
    );
    const admin = result.rows[0];

    if (!admin?.password) {
      return null;
    }

    const expected = createHmac('sha256', admin.password)
      .update(`${adminId}.${expiresAt}`)
      .digest('base64url');

    if (!this.isValidSignature(signature, expected)) {
      return null;
    }

    return {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName,
    };
  }

  private isValidSignature(received: string, expected: string): boolean {
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);

    return (
      receivedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(receivedBuffer, expectedBuffer)
    );
  }
}
