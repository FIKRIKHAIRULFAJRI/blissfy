import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { adminAuthPool } from "@/lib/admin/db";

const ADMIN_SESSION_COOKIE = "blissfy_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type AdminSessionRecord = {
  id: string;
  email: string;
  displayName: string | null;
};

function signSession(payload: string, password: string) {
  return createHmac("sha256", password).update(payload).digest("base64url");
}

function isValidSignature(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function createAdminSession(adminId: string, password: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${adminId}.${expiresAt}`;
  const signature = signSession(payload, password);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getAdminSessionToken() {
  const cookieStore = await cookies();

  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function getAdminSession() {
  const session = await getAdminSessionToken();

  if (!session) {
    return null;
  }

  const [adminId, expiresAtRaw, signature] = session.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (!adminId || !Number.isInteger(expiresAt) || !signature) {
    return null;
  }

  if (expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const result = await adminAuthPool.query<
    AdminSessionRecord & { password: string | null }
  >(
    `
      SELECT
        id,
        email,
        "displayName",
        password
      FROM admin_users
      WHERE id = $1
      LIMIT 1
    `,
    [adminId],
  );
  const admin = result.rows[0];

  if (!admin?.password) {
    return null;
  }

  const expected = signSession(`${adminId}.${expiresAt}`, admin.password);

  if (!isValidSignature(signature, expected)) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
  };
}
