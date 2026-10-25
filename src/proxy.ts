import { type NextRequest, NextResponse } from "next/server";

// Must match SESSION_COOKIE in src/lib/auth/session.ts (not imported: that
// module needs the database, which Proxy must not touch).
const SESSION_COOKIE = "autocare_admin";

/**
 * Optimistic check only: requests to /admin without a session cookie go to
 * the login page. The real check (is the session valid?) happens in
 * requireAdmin() and in every admin Server Action.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
