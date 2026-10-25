import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

/**
 * Tests use their own database so they never touch development data.
 *
 * TEST_DATABASE_URL wins (CI sets it). Otherwise the database name from
 * DATABASE_URL in .env.local gets a "_test" suffix.
 */
export function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  // Next.js skips .env.local when NODE_ENV=test, so read the value directly.
  const base =
    process.env.DATABASE_URL ??
    (existsSync(".env.local")
      ? parseEnv(readFileSync(".env.local", "utf8")).DATABASE_URL
      : undefined);
  if (!base) throw new Error("Set TEST_DATABASE_URL or DATABASE_URL (see .env.example).");
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/^\//, "")}_test`;
  return url.toString();
}

/** Creates the test database if needed and applies all migrations. */
export async function prepareTestDatabase(databaseUrl: string): Promise<void> {
  const url = new URL(databaseUrl);
  const name = url.pathname.replace(/^\//, "");
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error(`Unexpected test database name "${name}"`);

  const admin = new URL(databaseUrl);
  admin.pathname = "/postgres";
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const exists = await client.query("select 1 from pg_database where datname = $1", [name]);
    if (exists.rowCount === 0) await client.query(`create database "${name}"`);
  } finally {
    await client.end();
  }

  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  } finally {
    await pool.end();
  }
}

/** Removes all rows. Only ever runs against the test database. */
export async function truncateAll(databaseUrl: string): Promise<void> {
  if (!new URL(databaseUrl).pathname.endsWith("_test")) {
    throw new Error("Refusing to truncate a database whose name does not end in _test");
  }
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(
      "truncate booking_requests, admin_sessions, admin_users, rate_limit_events restart identity cascade",
    );
  } finally {
    await client.end();
  }
}
