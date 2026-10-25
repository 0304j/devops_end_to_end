import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";

/**
 * Readiness: can this instance serve requests, including database access?
 * Kubernetes stops routing traffic to the instance while this fails.
 */
export async function GET() {
  await connection();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
