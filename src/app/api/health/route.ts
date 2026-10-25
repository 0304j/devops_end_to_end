import { connection } from "next/server";

/**
 * Liveness: is the Node.js process able to answer? Deliberately does not
 * check the database – a database outage must not make Kubernetes restart
 * healthy app containers.
 */
export async function GET() {
  await connection();
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
