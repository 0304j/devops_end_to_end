import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Database = NodePgDatabase<typeof schema>;

// In development, hot reloading re-evaluates modules. Keep a single pool on
// globalThis so we don't open new connections on every reload.
const globalForDb = globalThis as unknown as { pgPool?: Pool; db?: Database };

/**
 * Created on first use, not at import: `next build` imports this module while
 * collecting routes, and the build (e.g. in Docker) has no DATABASE_URL.
 */
function getDb(): Database {
  if (!globalForDb.db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
    }
    globalForDb.pgPool = new Pool({ connectionString, max: 10 });
    globalForDb.db = drizzle(globalForDb.pgPool, { schema });
  }
  return globalForDb.db;
}

export const db: Database = new Proxy({} as Database, {
  get: (_target, property) => Reflect.get(getDb(), property),
});

/** Closes all connections. Used by tests; the app keeps the pool open. */
export async function closeDb() {
  await globalForDb.pgPool?.end();
  globalForDb.pgPool = undefined;
  globalForDb.db = undefined;
}
