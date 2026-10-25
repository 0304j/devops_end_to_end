import "server-only";
import { createHmac } from "node:crypto";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rateLimitEvents } from "@/lib/db/schema";

/**
 * Database-backed rate limiting. Works across several app instances (e.g.
 * Kubernetes replicas), unlike an in-memory counter.
 */

export type RateLimitRule = { limit: number; windowMs: number };

/** Pseudonymises personal values (IP, e-mail) before they are used as keys. */
export function hashIdentifier(value: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set. See .env.example.");
  return createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);
}

/**
 * Client IP from the reverse proxy headers. Only trustworthy behind a proxy
 * that overwrites X-Forwarded-For (e.g. the Kubernetes ingress).
 */
export async function clientIp(): Promise<string> {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown"
  );
}

export async function isRateLimited(key: string, { limit, windowMs }: RateLimitRule) {
  const [row] = await db
    .select({ value: count() })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.key, key),
        gte(rateLimitEvents.createdAt, new Date(Date.now() - windowMs)),
      ),
    );
  return (row?.value ?? 0) >= limit;
}

export async function recordRateLimitEvent(key: string) {
  await db.insert(rateLimitEvents).values({ key });
  // Opportunistic cleanup: about 1 in 50 calls removes events older than a day.
  if (Math.random() < 0.02) {
    await db
      .delete(rateLimitEvents)
      .where(lt(rateLimitEvents.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
  }
}

export async function clearRateLimit(key: string) {
  await db.delete(rateLimitEvents).where(eq(rateLimitEvents.key, key));
}
