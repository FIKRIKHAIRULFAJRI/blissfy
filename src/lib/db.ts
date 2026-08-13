import "server-only";

import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for server-side database access.");
}

const globalForDb = globalThis as unknown as {
  dbPool?: Pool;
};

export const db =
  globalForDb.dbPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbPool = db;
}
