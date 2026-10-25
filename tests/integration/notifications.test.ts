import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetForRetry } from "@/lib/admin/bookings";
import { getBookingById, insertBookingRequest } from "@/lib/booking/repository";
import { processBookingNotification } from "@/lib/notifications/process-booking";

const outputDir = process.env.MOCK_NOTIFICATION_DIR!;

async function createBooking() {
  const result = await insertBookingRequest({
    serviceId: "klima",
    date: "2026-10-27",
    time: "14:00",
    vehicleMake: "Opel",
    vehicleModel: "Astra",
    vehicleYear: "",
    licensePlate: "",
    description: "Die Klimaanlage kühlt nicht mehr richtig.",
    name: "Hans Beispiel",
    phone: "0171 2223334",
    email: "hans@example.com",
    consent: true,
  });
  if (!result.ok) throw new Error("insert failed");
  return result.id;
}

beforeEach(async () => {
  await rm(outputDir, { recursive: true, force: true });
});

afterEach(() => {
  delete process.env.MOCK_TRANSLATION_FAIL;
  delete process.env.MOCK_NOTIFICATION_FAIL;
  process.env.TRANSLATION_PROVIDER = "mock";
  process.env.NOTIFICATION_PROVIDER = "mock";
});

describe("processBookingNotification", () => {
  it("translates, keeps the original and sends the Arabic notification", async () => {
    const id = await createBooking();
    await processBookingNotification(id);

    const row = await getBookingById(id);
    expect(row).toMatchObject({
      description: "Die Klimaanlage kühlt nicht mehr richtig.",
      translationStatus: "translated",
      translationProvider: "mock",
      notificationStatus: "sent",
      notificationAttempts: 1,
      notificationError: null,
    });
    expect(row?.descriptionAr).toContain("ليست ترجمة حقيقية");

    const [file] = await readdir(outputDir);
    const html = await readFile(path.join(outputDir, file), "utf8");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("صيانة المكيّف");
  });

  it("records a failed translation without inventing text, and still notifies", async () => {
    process.env.MOCK_TRANSLATION_FAIL = "true";
    const id = await createBooking();
    await processBookingNotification(id);

    const row = await getBookingById(id);
    expect(row?.translationStatus).toBe("failed");
    expect(row?.descriptionAr).toBeNull();
    expect(row?.notificationStatus).toBe("sent");
  });

  it("skips translation when no provider is configured", async () => {
    process.env.TRANSLATION_PROVIDER = "none";
    const id = await createBooking();
    await processBookingNotification(id);
    expect((await getBookingById(id))?.translationStatus).toBe("skipped");
  });

  it("keeps the booking and records the error when sending fails", async () => {
    process.env.MOCK_NOTIFICATION_FAIL = "true";
    const id = await createBooking();
    await processBookingNotification(id);

    const row = await getBookingById(id);
    expect(row?.status).toBe("requested");
    expect(row?.notificationStatus).toBe("failed");
    expect(row?.notificationAttempts).toBe(1);
    expect(row?.notificationError).toContain("MOCK_NOTIFICATION_FAIL");
  });

  it("can be retried and does not send twice", async () => {
    process.env.MOCK_TRANSLATION_FAIL = "true";
    process.env.MOCK_NOTIFICATION_FAIL = "true";
    const id = await createBooking();
    await processBookingNotification(id);

    delete process.env.MOCK_TRANSLATION_FAIL;
    delete process.env.MOCK_NOTIFICATION_FAIL;
    await resetForRetry(id);
    await processBookingNotification(id);
    await processBookingNotification(id); // already sent → no-op

    const row = await getBookingById(id);
    expect(row?.translationStatus).toBe("translated");
    expect(row?.notificationStatus).toBe("sent");
    expect(row?.notificationAttempts).toBe(2);
    expect(await readdir(outputDir)).toHaveLength(1);
  });
});
