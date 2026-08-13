import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const password = process.argv[2];

if (!password || password.length < 8) {
  console.error("Usage: npm run admin:hash-password -- \"your-strong-password\"");
  console.error("Password minimal 8 karakter.");
  process.exit(1);
}

const salt = randomBytes(16).toString("base64url");
const derivedKey = await scrypt(password, salt, 64);

console.log(`scrypt:${salt}:${derivedKey.toString("base64url")}`);
