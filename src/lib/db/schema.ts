import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Database schema. After changing this file run `npm run db:generate` to
 * create a migration, review the generated SQL, then `npm run db:migrate`.
 */

export const bookingStatus = pgEnum("booking_status", [
  "requested", // submitted by the customer, not yet reviewed
  "confirmed", // accepted by the garage
  "rejected", // declined by the garage
  "cancelled", // withdrawn after confirmation
]);

export const translationStatus = pgEnum("translation_status", [
  "pending", // not attempted yet
  "translated", // description_ar holds a translation
  "failed", // the provider failed; description_ar stays empty
  "skipped", // no translation provider configured
]);

export const notificationStatus = pgEnum("notification_status", [
  "pending", // not sent yet
  "sent", // delivered to the notification provider
  "failed", // sending failed; can be retried
]);

export const bookingRequests = pgTable(
  "booking_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: bookingStatus("status").notNull().default("requested"),

    serviceId: text("service_id").notNull(),
    /** Start of the drop-off slot as an absolute instant (stored in UTC). */
    slotStart: timestamp("slot_start", { withTimezone: true }).notNull(),

    vehicleMake: text("vehicle_make").notNull(),
    vehicleModel: text("vehicle_model").notNull(),
    vehicleYear: smallint("vehicle_year"),
    licensePlate: text("license_plate"),

    /** The customer's original German description. Never overwritten. */
    description: text("description").notNull(),
    /** Arabic translation for the garage owner. Null unless translation succeeded. */
    descriptionAr: text("description_ar"),
    translationStatus: translationStatus("translation_status").notNull().default("pending"),
    /** Which provider produced description_ar, e.g. "deepl" or "mock". */
    translationProvider: text("translation_provider"),

    notificationStatus: notificationStatus("notification_status").notNull().default("pending"),
    notificationAttempts: smallint("notification_attempts").notNull().default(0),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    /** Technical error of the last failed attempt. Never contains personal data. */
    notificationError: text("notification_error"),

    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email").notNull(),
    /** When the customer agreed to the processing of their data. */
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // One active request per slot. Rejected and cancelled requests free the
    // slot again. The database enforces this even under concurrent inserts.
    uniqueIndex("booking_requests_active_slot_uq")
      .on(table.slotStart)
      .where(sql`${table.status} in ('requested', 'confirmed')`),
    index("booking_requests_created_at_idx").on(table.createdAt),
    check(
      "booking_requests_description_length",
      sql`char_length(${table.description}) between 10 and 2000`,
    ),
    check(
      "booking_requests_vehicle_year_range",
      sql`${table.vehicleYear} is null or ${table.vehicleYear} between 1950 and 2100`,
    ),
  ],
);

export type BookingRequestRow = typeof bookingRequests.$inferSelect;
