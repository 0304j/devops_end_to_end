import { z } from "zod";
import { site } from "@/config/site";

/**
 * Validation rules for a booking request. Shared by the browser (Phase 2) and
 * the server (Phase 3) so both apply exactly the same rules. Error messages
 * are shown to customers and are therefore in German.
 */

export const OTHER_SERVICE_ID = "sonstiges";

export const serviceOptions = [
  ...site.services.map(({ id, title }) => ({ id, title })),
  { id: OTHER_SERVICE_ID, title: "Sonstiges / weiß ich nicht" },
];

const serviceIds = new Set(serviceOptions.map((option) => option.id));

const maxVehicleYear = new Date().getFullYear() + 1;

const requiredText = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, `Bitte höchstens ${max} Zeichen.`);

export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 2000;

export const bookingRequestSchema = z.object({
  serviceId: z.string().refine((id) => serviceIds.has(id), "Bitte wählen Sie eine Leistung."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte wählen Sie einen Tag."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Bitte wählen Sie eine Uhrzeit."),

  vehicleMake: requiredText("Bitte geben Sie die Marke an.", 50),
  vehicleModel: requiredText("Bitte geben Sie das Modell an.", 50),
  vehicleYear: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (/^\d{4}$/.test(value) && Number(value) >= 1950 && Number(value) <= maxVehicleYear),
      `Bitte ein Jahr zwischen 1950 und ${maxVehicleYear} angeben.`,
    ),
  licensePlate: z
    .string()
    .trim()
    .max(12, "Bitte höchstens 12 Zeichen.")
    .regex(/^[\p{L}\d\s-]*$/u, "Bitte nur Buchstaben, Ziffern, Leerzeichen und Bindestriche."),

  description: z
    .string()
    .trim()
    .min(
      DESCRIPTION_MIN,
      `Bitte beschreiben Sie Ihr Anliegen in mindestens ${DESCRIPTION_MIN} Zeichen.`,
    )
    .max(DESCRIPTION_MAX, `Bitte höchstens ${DESCRIPTION_MAX} Zeichen.`),

  name: requiredText("Bitte geben Sie Ihren Namen an.", 100).min(
    2,
    "Bitte geben Sie Ihren vollständigen Namen an.",
  ),
  phone: z
    .string()
    .trim()
    .min(1, "Bitte geben Sie eine Telefonnummer an.")
    .regex(/^\+?[\d\s()/-]{6,20}$/, "Bitte geben Sie eine gültige Telefonnummer an."),
  email: z
    .string()
    .trim()
    .min(1, "Bitte geben Sie Ihre E-Mail-Adresse an.")
    .pipe(z.email("Bitte geben Sie eine gültige E-Mail-Adresse an.")),

  consent: z.literal(true, "Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu."),
});

/** Raw form values, as typed by the customer (consent starts unticked). */
export type BookingFormValues = Omit<z.input<typeof bookingRequestSchema>, "consent"> & {
  consent: boolean;
};
/** Validated and trimmed request. */
export type BookingRequest = z.output<typeof bookingRequestSchema>;
export type BookingField = keyof BookingFormValues;
export type FieldErrors = Partial<Record<BookingField, string>>;

/** Validates the values and returns the first error message per field. */
export function validateBooking(values: unknown) {
  const result = bookingRequestSchema.safeParse(values);
  if (result.success) return { data: result.data, errors: {} as FieldErrors };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as BookingField;
    errors[field] ??= issue.message;
  }
  return { data: null, errors };
}
