import { describe, expect, it } from "vitest";
import { type BookingFormValues, validateBooking } from "./schema";

const valid: BookingFormValues = {
  serviceId: "bremsen",
  date: "2026-10-26",
  time: "08:00",
  vehicleMake: " Volkswagen ",
  vehicleModel: "Golf",
  vehicleYear: "2016",
  licensePlate: "B-AC 1234",
  description: "Beim Bremsen quietscht es vorne links.",
  name: "Erika Mustermann",
  phone: "+49 30 987654",
  email: "erika@example.com",
  consent: true,
};

describe("validateBooking", () => {
  it("accepts a complete request and trims text", () => {
    const { data, errors } = validateBooking(valid);
    expect(errors).toEqual({});
    expect(data?.vehicleMake).toBe("Volkswagen");
  });

  it("accepts empty optional fields", () => {
    expect(validateBooking({ ...valid, vehicleYear: "", licensePlate: "" }).data).not.toBeNull();
  });

  it("reports one German message per invalid field", () => {
    const { data, errors } = validateBooking({
      ...valid,
      serviceId: "",
      date: "",
      email: "erika@",
      description: "kurz",
      consent: false,
    });
    expect(data).toBeNull();
    expect(errors).toEqual({
      serviceId: "Bitte wählen Sie eine Leistung.",
      date: "Bitte wählen Sie einen Tag.",
      email: "Bitte geben Sie eine gültige E-Mail-Adresse an.",
      description: "Bitte beschreiben Sie Ihr Anliegen in mindestens 10 Zeichen.",
      consent: "Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.",
    });
  });

  it.each([
    ["unknown service", { serviceId: "tuning" }, "serviceId"],
    ["malformed time", { time: "8 Uhr" }, "time"],
    ["year too old", { vehicleYear: "1900" }, "vehicleYear"],
    ["year not numeric", { vehicleYear: "abcd" }, "vehicleYear"],
    ["plate with symbols", { licensePlate: "B<script>" }, "licensePlate"],
    ["phone with letters", { phone: "call me" }, "phone"],
    ["name too short", { name: "E" }, "name"],
    ["description too long", { description: "x".repeat(2001) }, "description"],
  ])("rejects %s", (_label, override, field) => {
    const { errors } = validateBooking({ ...valid, ...override });
    expect(errors).toHaveProperty(field);
  });

  it("rejects input that is not an object (untrusted Server Action input)", () => {
    expect(validateBooking("hello").data).toBeNull();
    expect(validateBooking(null).data).toBeNull();
  });
});
