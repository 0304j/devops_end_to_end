import "server-only";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { type BookingRequestRow, bookingRequests } from "@/lib/db/schema";
import {
  type AvailabilityDay,
  addDays,
  getBookingDays,
  timeZone,
  withAvailability,
} from "./availability";
import type { BookingRequest } from "./schema";

/** Statuses that occupy a slot. Must match the partial unique index in the schema. */
const ACTIVE_STATUSES = ["requested", "confirmed"] as const;

/** A garage-local "YYYY-MM-DD" + "HH:MM" as an SQL timestamptz, converted by PostgreSQL. */
const garageInstant = (date: string, time = "00:00") =>
  sql`(${`${date} ${time}`}::timestamp at time zone ${timeZone})`;

/**
 * Bookable days with free/taken flags. Returns only slot times – never any
 * customer data – because the result is sent to the browser.
 */
export async function getAvailability(now: Date = new Date()): Promise<AvailabilityDay[]> {
  const days = getBookingDays(now);
  if (days.length === 0) return [];

  const rows = await db
    .select({
      slot: sql<string>`to_char(${bookingRequests.slotStart} at time zone ${timeZone}, 'YYYY-MM-DD"T"HH24:MI')`,
    })
    .from(bookingRequests)
    .where(
      and(
        inArray(bookingRequests.status, [...ACTIVE_STATUSES]),
        gte(bookingRequests.slotStart, garageInstant(days[0].date)),
        lt(bookingRequests.slotStart, garageInstant(addDays(days.at(-1)!.date, 1))),
      ),
    );

  return withAvailability(days, new Set(rows.map((row) => row.slot)));
}

export type InsertBookingResult = { ok: true; id: string } | { ok: false; reason: "slot_taken" };

/**
 * Stores a validated request. The partial unique index guarantees that two
 * concurrent requests for the same slot cannot both succeed: the second insert
 * fails with a unique violation, which we report as "slot_taken".
 */
export async function insertBookingRequest(request: BookingRequest): Promise<InsertBookingResult> {
  try {
    const [row] = await db
      .insert(bookingRequests)
      .values({
        serviceId: request.serviceId,
        slotStart: garageInstant(request.date, request.time),
        vehicleMake: request.vehicleMake,
        vehicleModel: request.vehicleModel,
        vehicleYear: request.vehicleYear === "" ? null : Number(request.vehicleYear),
        licensePlate: request.licensePlate === "" ? null : request.licensePlate.toUpperCase(),
        description: request.description,
        customerName: request.name,
        customerPhone: request.phone,
        customerEmail: request.email.toLowerCase(),
        consentAt: new Date(),
      })
      .returning({ id: bookingRequests.id });
    return { ok: true, id: row.id };
  } catch (error) {
    if (pgErrorCode(error) === "23505") return { ok: false, reason: "slot_taken" };
    throw error;
  }
}

export async function getBookingById(id: string): Promise<BookingRequestRow | undefined> {
  const [row] = await db.select().from(bookingRequests).where(eq(bookingRequests.id, id));
  return row;
}

export type TranslationResult =
  | { status: "translated"; descriptionAr: string; provider: string }
  | { status: "failed"; provider: string | null }
  | { status: "skipped" };

/** Stores the translation outcome. The German original is never touched. */
export async function saveTranslationResult(id: string, result: TranslationResult) {
  const [row] = await db
    .update(bookingRequests)
    .set({
      translationStatus: result.status,
      descriptionAr: result.status === "translated" ? result.descriptionAr : null,
      translationProvider: result.status === "skipped" ? null : result.provider,
      updatedAt: new Date(),
    })
    .where(eq(bookingRequests.id, id))
    .returning();
  return row;
}

export async function recordNotificationResult(
  id: string,
  result: { ok: true } | { ok: false; error: string },
) {
  await db
    .update(bookingRequests)
    .set({
      notificationStatus: result.ok ? "sent" : "failed",
      notificationAttempts: sql`${bookingRequests.notificationAttempts} + 1`,
      notifiedAt: result.ok ? new Date() : null,
      notificationError: result.ok ? null : result.error.slice(0, 200),
      updatedAt: new Date(),
    })
    .where(eq(bookingRequests.id, id));
}

/** Extracts the PostgreSQL error code (Drizzle wraps driver errors in `cause`). */
export function pgErrorCode(error: unknown): string | undefined {
  for (let current = error; current instanceof Error; current = current.cause) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}
