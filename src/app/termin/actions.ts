"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { isBookableSlot } from "@/lib/booking/availability";
import { insertBookingRequest, pgErrorCode } from "@/lib/booking/repository";
import { validateBooking } from "@/lib/booking/schema";
import type { BookingSubmitState } from "@/lib/booking/submit-state";
import { processBookingNotification } from "@/lib/notifications/process-booking";
import {
  clientIp,
  hashIdentifier,
  isRateLimited,
  recordRateLimitEvent,
} from "@/lib/security/rate-limit";

/** Successful requests per IP and hour. Generous for families sharing a connection. */
const BOOKING_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

const SLOT_TAKEN_MESSAGE =
  "Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie eine andere Uhrzeit.";

/**
 * Stores a booking request. Everything coming from the browser is untrusted,
 * so the input is validated again here with the same schema as in the form.
 */
export async function requestBooking(
  _previous: BookingSubmitState,
  input: unknown,
): Promise<BookingSubmitState> {
  const { data } = validateBooking(input);
  if (!data) {
    return { status: "error", message: "Bitte prüfen Sie Ihre Angaben." };
  }

  if (!isBookableSlot(data.date, data.time)) {
    refresh();
    return { status: "error", message: SLOT_TAKEN_MESSAGE };
  }

  try {
    const rateLimitKey = `booking:ip:${hashIdentifier(await clientIp())}`;
    if (await isRateLimited(rateLimitKey, BOOKING_RATE_LIMIT)) {
      return {
        status: "error",
        message: "Sie haben in kurzer Zeit sehr viele Anfragen gesendet. Bitte rufen Sie uns an.",
      };
    }

    const result = await insertBookingRequest(data);
    if (result.ok) await recordRateLimitEvent(rateLimitKey);
    // Re-render the page so the availability shown in the form is current.
    refresh();
    if (!result.ok) {
      return { status: "error", message: SLOT_TAKEN_MESSAGE };
    }

    // Translate and notify the garage owner after the response is sent, so the
    // customer never waits for (or is affected by) external services.
    const bookingId = result.id;
    after(async () => {
      try {
        await processBookingNotification(bookingId);
      } catch (error) {
        console.error("[notification] processing failed", {
          bookingId,
          code: pgErrorCode(error),
          error: error instanceof Error ? error.name : typeof error,
        });
      }
    });

    return { status: "success", request: data };
  } catch (error) {
    // Log only technical details – no names, phone numbers or descriptions.
    console.error("[booking] could not store request", {
      code: pgErrorCode(error),
      error: error instanceof Error ? error.name : typeof error,
    });
    return {
      status: "error",
      message:
        "Ihre Anfrage konnte gerade nicht gespeichert werden. Bitte versuchen Sie es in einigen Minuten erneut.",
    };
  }
}
