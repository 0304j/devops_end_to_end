import { connection } from "next/server";
import { site } from "@/config/site";
import type { AvailabilityDay } from "@/lib/booking/availability";
import { getAvailability, pgErrorCode } from "@/lib/booking/repository";
import { BookingFlow } from "./booking-flow";

/**
 * Loads current availability at request time (it depends on today's date and
 * on the database) and renders the form. Wrapped in <Suspense> by the page so
 * the rest of the page stays static.
 */
export async function BookingSection() {
  await connection();

  let days: AvailabilityDay[];
  try {
    days = await getAvailability();
  } catch (error) {
    console.error("[booking] could not load availability", { code: pgErrorCode(error) });
    return <BookingUnavailable />;
  }

  return <BookingFlow days={days} />;
}

function BookingUnavailable() {
  return (
    <div role="alert" className="border-2 border-danger bg-field p-6">
      <p className="font-semibold text-danger">
        Die Online-Terminanfrage ist im Moment nicht erreichbar.
      </p>
      <p className="mt-2 text-ink-soft">
        Bitte versuchen Sie es später erneut oder rufen Sie uns an:{" "}
        <a href={`tel:${site.contact.phoneHref}`} className="font-medium underline">
          {site.contact.phoneDisplay}
        </a>
      </p>
    </div>
  );
}

export function BookingSectionSkeleton() {
  return (
    <p role="status" className="border border-dashed border-line px-4 py-6 text-muted">
      Verfügbare Termine werden geladen …
    </p>
  );
}
