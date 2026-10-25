import { describe, expect, it } from "vitest";
import { type BookingNotificationData, renderBookingNotification } from "./booking-template";

const booking: BookingNotificationData = {
  id: "9b75f4af-5bf9-4be7-81fd-f577d3a4ee43",
  serviceId: "bremsen",
  slotStart: new Date("2026-10-26T07:00:00Z"), // 08:00 in Berlin
  vehicleMake: "Volkswagen",
  vehicleModel: "Golf",
  vehicleYear: 2016,
  licensePlate: "B-AC 1234",
  description: "Quietscht <script>alert(1)</script>",
  descriptionAr: "صرير عند الفرملة",
  translationStatus: "translated",
  translationProvider: "deepl",
  customerName: "Erika <b>Mustermann</b>",
  customerPhone: "+49 30 987654",
  customerEmail: "erika@example.com",
};

describe("renderBookingNotification", () => {
  const message = renderBookingNotification(booking, { development: false });

  it("renders a right-to-left Arabic document", () => {
    expect(message.html).toContain('<html lang="ar" dir="rtl">');
    expect(message.subject).toBe("طلب موعد جديد: الفرامل – الاثنين، 26 أكتوبر 2026، 08:00");
  });

  it("escapes all customer input", () => {
    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
    expect(message.html).not.toContain("<b>Mustermann</b>");
  });

  it("contains the translation, the German original and the contact details", () => {
    expect(message.html).toContain("صرير عند الفرملة");
    expect(message.html).toContain('dir="ltr" lang="de"');
    expect(message.html).toContain('href="tel:+4930987654"');
    expect(message.text).toContain("erika@example.com");
    expect(message.text).toContain("ترجمة آلية من الألمانية");
  });

  it("says clearly that it is a request, not a confirmation", () => {
    expect(message.text).toContain("وليس موعدًا مؤكدًا");
  });

  it("never shows a translation when translation failed", () => {
    const failed = renderBookingNotification(
      { ...booking, translationStatus: "failed", descriptionAr: null },
      { development: false },
    );
    expect(failed.text).toContain("تعذّرت الترجمة الآلية");
    expect(failed.html).not.toContain("صرير");
  });

  it("explains when translation is disabled", () => {
    const skipped = renderBookingNotification(
      { ...booking, translationStatus: "skipped", descriptionAr: null },
      { development: false },
    );
    expect(skipped.text).toContain("الترجمة الآلية غير مفعّلة");
  });

  it("marks development messages", () => {
    const dev = renderBookingNotification(booking, { development: true });
    expect(dev.subject.startsWith("[DEV] ")).toBe(true);
    expect(dev.html).toContain("Entwicklungsmodus");
  });
});
