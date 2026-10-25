import "server-only";
import { and, asc, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { pgErrorCode } from "@/lib/booking/repository";
import { timeZone } from "@/lib/booking/availability";
import { db } from "@/lib/db";
import { type BookingRequestRow, bookingRequests } from "@/lib/db/schema";

export type BookingStatus = BookingRequestRow["status"];

export const statusFilters = {
  offen: ["requested"],
  bestaetigt: ["confirmed"],
  abgeschlossen: ["rejected", "cancelled"],
  alle: ["requested", "confirmed", "rejected", "cancelled"],
} as const satisfies Record<string, readonly BookingStatus[]>;

export type StatusFilter = keyof typeof statusFilters;
export type RangeFilter = "kommend" | "vergangen";

export async function listBookings(status: StatusFilter, range: RangeFilter) {
  const now = new Date();
  return db
    .select()
    .from(bookingRequests)
    .where(
      and(
        inArray(bookingRequests.status, [...statusFilters[status]]),
        range === "kommend"
          ? gte(bookingRequests.slotStart, now)
          : lt(bookingRequests.slotStart, now),
      ),
    )
    .orderBy(range === "kommend" ? asc(bookingRequests.slotStart) : desc(bookingRequests.slotStart))
    .limit(200);
}

/** Number of open requests with an upcoming slot, for the navigation badge. */
export async function countOpenRequests() {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(bookingRequests)
    .where(
      and(eq(bookingRequests.status, "requested"), gte(bookingRequests.slotStart, new Date())),
    );
  return row?.value ?? 0;
}

/**
 * Allowed status changes. The current status is part of the WHERE clause, so
 * a change made in another tab in the meantime is detected instead of
 * silently overwritten.
 */
export const transitions = {
  confirm: { from: ["requested"], to: "confirmed" },
  reject: { from: ["requested"], to: "rejected" },
  cancel: { from: ["confirmed"], to: "cancelled" },
} as const satisfies Record<string, { from: readonly BookingStatus[]; to: BookingStatus }>;

export type TransitionName = keyof typeof transitions;

export async function applyTransition(id: string, name: TransitionName): Promise<boolean> {
  const { from, to } = transitions[name];
  const updated = await db
    .update(bookingRequests)
    .set({ status: to, updatedAt: new Date() })
    .where(and(eq(bookingRequests.id, id), inArray(bookingRequests.status, [...from])))
    .returning({ id: bookingRequests.id });
  return updated.length === 1;
}

export type RescheduleResult = "ok" | "not_found" | "slot_taken";

export async function rescheduleBooking(
  id: string,
  date: string,
  time: string,
): Promise<RescheduleResult> {
  try {
    const updated = await db
      .update(bookingRequests)
      .set({
        slotStart: sql`(${`${date} ${time}`}::timestamp at time zone ${timeZone})`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bookingRequests.id, id),
          inArray(bookingRequests.status, ["requested", "confirmed"]),
        ),
      )
      .returning({ id: bookingRequests.id });
    return updated.length === 1 ? "ok" : "not_found";
  } catch (error) {
    if (pgErrorCode(error) === "23505") return "slot_taken";
    throw error;
  }
}

/** Prepares a failed translation/notification to be processed again. */
export async function resetForRetry(id: string) {
  await db
    .update(bookingRequests)
    .set({ translationStatus: "pending", updatedAt: new Date() })
    .where(and(eq(bookingRequests.id, id), eq(bookingRequests.translationStatus, "failed")));
}
