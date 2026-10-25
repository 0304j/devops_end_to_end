import { describe, expect, it } from "vitest";
import { applyTransition, rescheduleBooking } from "@/lib/admin/bookings";
import { getAvailability, getBookingById, insertBookingRequest } from "@/lib/booking/repository";
import type { BookingRequest } from "@/lib/booking/schema";

const request = (overrides: Partial<BookingRequest> = {}): BookingRequest => ({
  serviceId: "bremsen",
  date: "2026-10-26",
  time: "08:00",
  vehicleMake: "Volkswagen",
  vehicleModel: "Golf",
  vehicleYear: "2016",
  licensePlate: "b-ac 1234",
  description: "Beim Bremsen quietscht es vorne links.",
  name: "Erika Mustermann",
  phone: "+49 30 987654",
  email: "Erika@Example.com",
  consent: true,
  ...overrides,
});

const sundayEvening = new Date("2026-10-25T21:00:00Z");

async function insertOk(overrides?: Partial<BookingRequest>) {
  const result = await insertBookingRequest(request(overrides));
  if (!result.ok) throw new Error("insert failed");
  return result.id;
}

describe("insertBookingRequest", () => {
  it("stores the request with the slot converted from Berlin time to UTC", async () => {
    const id = await insertOk();
    const row = await getBookingById(id);

    expect(row?.slotStart.toISOString()).toBe("2026-10-26T07:00:00.000Z");
    expect(row?.status).toBe("requested");
    expect(row?.licensePlate).toBe("B-AC 1234");
    expect(row?.customerEmail).toBe("erika@example.com");
    expect(row?.description).toBe("Beim Bremsen quietscht es vorne links.");
    expect(row?.translationStatus).toBe("pending");
  });

  it("handles summer time correctly", async () => {
    const id = await insertOk({ date: "2026-10-24", time: "09:00" });
    // 24 October is still summer time (UTC+2).
    expect((await getBookingById(id))?.slotStart.toISOString()).toBe("2026-10-24T07:00:00.000Z");
  });

  it("allows only one of many simultaneous requests for the same slot", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => insertBookingRequest(request({ name: `Kunde ${i}` }))),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.reason === "slot_taken")).toHaveLength(4);
  });

  it("frees the slot again when the request is rejected", async () => {
    const id = await insertOk();
    expect((await insertBookingRequest(request())).ok).toBe(false);
    await applyTransition(id, "reject");
    expect((await insertBookingRequest(request())).ok).toBe(true);
  });
});

describe("getAvailability", () => {
  it("marks requested slots as taken and returns no customer data", async () => {
    await insertOk({ time: "09:00" });
    const days = await getAvailability(sundayEvening);
    const monday = days.find((day) => day.date === "2026-10-26")!;

    expect(monday.slots.find((s) => s.time === "09:00")).toEqual({
      time: "09:00",
      available: false,
    });
    expect(monday.slots.find((s) => s.time === "08:00")?.available).toBe(true);
    expect(JSON.stringify(days)).not.toContain("Erika");
  });
});

describe("admin changes", () => {
  it("only allows valid status transitions", async () => {
    const id = await insertOk();
    expect(await applyTransition(id, "cancel")).toBe(false); // not confirmed yet
    expect(await applyTransition(id, "confirm")).toBe(true);
    expect(await applyTransition(id, "confirm")).toBe(false); // already confirmed
    expect(await applyTransition(id, "reject")).toBe(false);
    expect(await applyTransition(id, "cancel")).toBe(true);
    expect((await getBookingById(id))?.status).toBe("cancelled");
  });

  it("reschedules to a free slot and refuses a taken one", async () => {
    const id = await insertOk({ time: "08:00" });
    await insertOk({ time: "10:00", name: "Andere Kundin" });

    expect(await rescheduleBooking(id, "2026-10-26", "10:00")).toBe("slot_taken");
    expect(await rescheduleBooking(id, "2026-10-26", "11:00")).toBe("ok");
    expect((await getBookingById(id))?.slotStart.toISOString()).toBe("2026-10-26T10:00:00.000Z");
  });

  it("does not reschedule rejected requests", async () => {
    const id = await insertOk();
    await applyTransition(id, "reject");
    expect(await rescheduleBooking(id, "2026-10-27", "08:00")).toBe("not_found");
  });
});
