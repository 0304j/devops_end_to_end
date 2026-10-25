import { describe, expect, it } from "vitest";
import {
  addDays,
  formatLongDate,
  formatShortDate,
  getBookingDays,
  isBookableSlot,
  slotsFor,
  todayInGarage,
  weekdayOf,
  withAvailability,
} from "./availability";

// 2026-10-25 is a Sunday; daylight-saving time in Berlin ends at 03:00 that day.
const sundayEvening = new Date("2026-10-25T21:00:00Z"); // 22:00 in Berlin
const lateSaturdayUtc = new Date("2026-10-24T22:30:00Z"); // already Sunday 00:30 in Berlin

describe("calendar helpers", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("returns the weekday independent of the machine time zone", () => {
    expect(weekdayOf("2026-10-25")).toBe(0);
    expect(weekdayOf("2026-10-26")).toBe(1);
  });

  it("uses the garage's date, not UTC", () => {
    expect(todayInGarage(lateSaturdayUtc)).toBe("2026-10-25");
    expect(todayInGarage(sundayEvening)).toBe("2026-10-25");
  });

  it("formats dates in German", () => {
    expect(formatShortDate("2026-10-26")).toBe("Mo., 26.10.");
    expect(formatLongDate("2026-10-26")).toBe("Montag, 26. Oktober 2026");
  });
});

describe("getBookingDays", () => {
  const days = getBookingDays(sundayEvening);

  it("starts tomorrow and covers the 21-day window", () => {
    expect(days[0].date).toBe("2026-10-26");
    expect(days.at(-1)!.date).toBe("2026-11-14");
  });

  it("skips Sundays", () => {
    expect(days.map((day) => weekdayOf(day.date))).not.toContain(0);
    expect(days).toHaveLength(18);
  });

  it("offers shorter hours on Saturdays", () => {
    expect(slotsFor("2026-10-31")).toEqual(["09:00", "10:00", "11:00"]);
    expect(slotsFor("2026-10-26")).toHaveLength(8);
  });
});

describe("isBookableSlot", () => {
  it("accepts a configured slot inside the window", () => {
    expect(isBookableSlot("2026-10-26", "08:00", sundayEvening)).toBe(true);
  });

  it.each([
    ["today", "2026-10-25", "09:00"],
    ["a Sunday", "2026-11-01", "09:00"],
    ["a time that is not a slot", "2026-10-26", "08:30"],
    ["the lunch break", "2026-10-26", "12:00"],
    ["Saturday afternoon", "2026-10-31", "14:00"],
    ["beyond the window", "2026-11-16", "08:00"],
    ["the past", "2026-10-20", "08:00"],
  ])("rejects %s", (_label, date, time) => {
    expect(isBookableSlot(date, time, sundayEvening)).toBe(false);
  });
});

describe("withAvailability", () => {
  it("marks taken slots as unavailable", () => {
    const [day] = withAvailability(
      [{ date: "2026-10-26", slots: ["08:00", "09:00"] }],
      new Set(["2026-10-26T09:00"]),
    );
    expect(day.slots).toEqual([
      { time: "08:00", available: true },
      { time: "09:00", available: false },
    ]);
  });
});
