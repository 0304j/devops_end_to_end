import { site } from "@/config/site";
import type { AvailabilityDay } from "@/lib/booking/availability";
import { serviceOptions } from "@/lib/booking/schema";
import type { BookingRequestRow } from "@/lib/db/schema";
import { BookingControls } from "./booking-controls";

const dateFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: site.booking.timeZone,
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: site.booking.timeZone,
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: site.booking.timeZone,
  dateStyle: "short",
  timeStyle: "short",
});

const statusBadges: Record<BookingRequestRow["status"], { label: string; className: string }> = {
  requested: { label: "Offen", className: "border-accent text-accent" },
  confirmed: { label: "Bestätigt", className: "border-ink bg-ink text-paper" },
  rejected: { label: "Abgelehnt", className: "border-line text-muted" },
  cancelled: { label: "Storniert", className: "border-line text-muted" },
};

const translationNotes: Record<BookingRequestRow["translationStatus"], string> = {
  pending: "Übersetzung ausstehend",
  translated: "Maschinell übersetzt",
  failed: "Übersetzung fehlgeschlagen",
  skipped: "Übersetzung deaktiviert",
};

export function BookingCard({
  booking,
  availability,
}: {
  booking: BookingRequestRow;
  availability: AvailabilityDay[];
}) {
  const service =
    serviceOptions.find((option) => option.id === booking.serviceId)?.title ?? booking.serviceId;
  const badge = statusBadges[booking.status];
  const vehicle = [booking.vehicleMake, booking.vehicleModel, booking.vehicleYear]
    .filter(Boolean)
    .join(" ");
  const headingId = `booking-${booking.id}`;

  return (
    <article aria-labelledby={headingId} className="border border-line bg-field">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-5 py-4">
        <h2 id={headingId} className="flex flex-wrap items-baseline gap-x-3 text-lg font-semibold">
          <span>{dateFormat.format(booking.slotStart)}</span>
          <span className="font-mono">{timeFormat.format(booking.slotStart)} Uhr</span>
          <span className="font-normal text-ink-soft">· {service}</span>
        </h2>
        <span
          className={`border px-2 py-0.5 font-mono text-xs tracking-wider uppercase ${badge.className}`}
        >
          {badge.label}
        </span>
      </header>

      <div className="grid gap-6 px-5 py-5 md:grid-cols-12">
        <dl className="space-y-3 md:col-span-4">
          <div>
            <dt className="eyebrow">Kunde</dt>
            <dd className="mt-1 font-medium">{booking.customerName}</dd>
            <dd>
              <a
                href={`tel:${booking.customerPhone.replace(/[^\d+]/g, "")}`}
                className="underline underline-offset-2 hover:text-accent"
              >
                {booking.customerPhone}
              </a>
            </dd>
            <dd>
              <a
                href={`mailto:${booking.customerEmail}`}
                className="break-all underline underline-offset-2 hover:text-accent"
              >
                {booking.customerEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Fahrzeug</dt>
            <dd className="mt-1">
              {vehicle}
              {booking.licensePlate ? (
                <span className="ml-2 font-mono">{booking.licensePlate}</span>
              ) : null}
            </dd>
          </div>
        </dl>

        <div className="space-y-4 md:col-span-8">
          <div>
            <h3 className="eyebrow">Beschreibung (Original)</h3>
            <p lang="de" className="mt-1 leading-relaxed whitespace-pre-line">
              {booking.description}
            </p>
          </div>
          <div>
            <h3 className="eyebrow">
              Arabisch · {translationNotes[booking.translationStatus]}
              {booking.translationProvider === "mock" ? " (Testmodus)" : ""}
            </h3>
            {booking.descriptionAr ? (
              <p
                lang="ar"
                dir="rtl"
                className="mt-1 leading-relaxed whitespace-pre-line [unicode-bidi:plaintext]"
              >
                {booking.descriptionAr}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">Keine Übersetzung vorhanden.</p>
            )}
          </div>
        </div>
      </div>

      <footer className="flex flex-col gap-4 border-t border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="font-mono text-xs text-muted">
          Eingegangen {dateTimeFormat.format(booking.createdAt)} · Benachrichtigung:{" "}
          {booking.notificationStatus === "sent"
            ? "gesendet"
            : booking.notificationStatus === "failed"
              ? `fehlgeschlagen (${booking.notificationAttempts}×)`
              : "ausstehend"}
        </p>
        <BookingControls
          id={booking.id}
          status={booking.status}
          canResend={
            booking.notificationStatus === "failed" || booking.translationStatus === "failed"
          }
          availability={availability}
        />
      </footer>
    </article>
  );
}
