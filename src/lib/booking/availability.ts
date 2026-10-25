import { site } from "@/config/site";

/**
 * Booking calendar helpers.
 *
 * Dates are plain calendar dates ("YYYY-MM-DD") and times are wall-clock times
 * ("HH:MM") in the garage's time zone. We never convert them through the
 * visitor's local time zone, so a customer abroad sees the same slots as one
 * in Berlin.
 */

export type BookingDay = {
  date: string;
  slots: readonly string[];
};

/** A day as shown in the booking form: configured slots plus whether each is still free. */
export type AvailabilityDay = {
  date: string;
  slots: { time: string; available: boolean }[];
};

export const slotKey = (date: string, time: string) => `${date}T${time}`;

export function withAvailability(
  days: BookingDay[],
  takenSlots: ReadonlySet<string>,
): AvailabilityDay[] {
  return days.map((day) => ({
    date: day.date,
    slots: day.slots.map((time) => ({ time, available: !takenSlots.has(slotKey(day.date, time)) })),
  }));
}

export const { timeZone } = site.booking;
const { minLeadDays, windowDays, closedDates } = site.booking;
const slotsByWeekday: Record<number, readonly string[]> = site.booking.slotsByWeekday;

/** Today's date in the garage's time zone. */
export function todayInGarage(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Calendar arithmetic on "YYYY-MM-DD" strings, independent of any time zone. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function slotsFor(date: string): readonly string[] {
  if (closedDates.includes(date)) return [];
  return slotsByWeekday[weekdayOf(date)] ?? [];
}

/** Days within the booking window that have at least one drop-off slot. */
export function getBookingDays(now: Date = new Date()): BookingDay[] {
  const today = todayInGarage(now);
  const days: BookingDay[] = [];
  for (let offset = minLeadDays; offset < minLeadDays + windowDays; offset++) {
    const date = addDays(today, offset);
    const slots = slotsFor(date);
    if (slots.length > 0) days.push({ date, slots });
  }
  return days;
}

/** True when the date/time pair is a configured slot inside the booking window. */
export function isBookableSlot(date: string, time: string, now: Date = new Date()): boolean {
  return getBookingDays(now).some((day) => day.date === date && day.slots.includes(time));
}

const shortDate = new Intl.DateTimeFormat("de-DE", {
  timeZone: "UTC",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});

const longDate = new Intl.DateTimeFormat("de-DE", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "Mo., 26.10." */
export function formatShortDate(date: string): string {
  return shortDate.format(new Date(`${date}T00:00:00Z`));
}

/** "Montag, 26. Oktober 2026" */
export function formatLongDate(date: string): string {
  return longDate.format(new Date(`${date}T00:00:00Z`));
}
