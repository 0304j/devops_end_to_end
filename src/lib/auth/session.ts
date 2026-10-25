import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { adminSessions, adminUsers } from "@/lib/db/schema";

/**
 * Admin sessions: a random token in an HttpOnly cookie, its SHA-256 hash in
 * the database. Stealing the database therefore does not reveal valid tokens,
 * and sessions can be revoked by deleting the row.
 */

export const SESSION_COOKIE = "autocare_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export type AdminUser = { id: string; email: string };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Secure cookies need HTTPS. COOKIE_SECURE=false allows plain-HTTP test setups. */
const secureCookies = () =>
  process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(adminSessions).values({ tokenHash: hashToken(token), userId, expiresAt });
  // Opportunistic cleanup of expired sessions.
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

/** The logged-in admin, or null. Checks the database on every call. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({ id: adminUsers.id, email: adminUsers.email })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
    .where(
      and(eq(adminSessions.tokenHash, hashToken(token)), gt(adminSessions.expiresAt, new Date())),
    );
  return row ?? null;
}

/** For pages: returns the admin or redirects to the login page. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}
