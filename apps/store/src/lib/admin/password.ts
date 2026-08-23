import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return `${HASH_PREFIX}:${salt}:${derivedKey.toString("base64url")}`;
}

export async function verifyAdminPassword({
  password,
  storedPassword,
}: {
  password: string;
  storedPassword: string;
}) {
  if (storedPassword.startsWith(`${HASH_PREFIX}:`)) {
    return verifyScryptPassword({ password, storedPassword });
  }

  const submitted = Buffer.from(password);
  const stored = Buffer.from(storedPassword);

  return (
    submitted.length === stored.length && timingSafeEqual(submitted, stored)
  );
}

async function verifyScryptPassword({
  password,
  storedPassword,
}: {
  password: string;
  storedPassword: string;
}) {
  const [prefix, salt, storedKey] = storedPassword.split(":");

  if (prefix !== HASH_PREFIX || !salt || !storedKey) {
    return false;
  }

  const stored = Buffer.from(storedKey, "base64url");
  const derived = (await scrypt(password, salt, stored.length)) as Buffer;

  if (stored.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(stored, derived);
}
