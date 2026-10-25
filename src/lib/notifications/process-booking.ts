import "server-only";
import {
  getBookingById,
  recordNotificationResult,
  saveTranslationResult,
  type TranslationResult,
} from "@/lib/booking/repository";
import type { BookingRequestRow } from "@/lib/db/schema";
import { getTranslator } from "@/lib/translation";
import { renderBookingNotification } from "./booking-template";
import { getNotifier } from "@/lib/notifications";
import { NotificationError } from "./types";

/**
 * Translates a new booking request and notifies the garage owner.
 *
 * Runs after the booking is already stored, so a failure here never loses the
 * booking: each outcome is saved on the row (translation_status,
 * notification_status) and failed notifications can be retried. Safe to call
 * again for the same booking: finished steps are skipped.
 */
export async function processBookingNotification(bookingId: string): Promise<void> {
  let booking = await getBookingById(bookingId);
  if (!booking) return;

  if (booking.translationStatus === "pending") {
    booking = (await saveTranslationResult(bookingId, await translate(booking))) ?? booking;
  }

  if (booking.notificationStatus !== "sent") {
    await notify(booking);
  }
}

async function translate(booking: BookingRequestRow): Promise<TranslationResult> {
  let providerName: string | null = null;
  try {
    const translator = getTranslator();
    if (!translator) return { status: "skipped" };
    providerName = translator.name;

    const descriptionAr = await translator.translate({
      text: booking.description,
      from: "de",
      to: "ar",
    });
    return { status: "translated", descriptionAr, provider: translator.name };
  } catch (error) {
    // Never fall back to an invented translation: record the failure and let
    // the notification show the German original with a clear notice.
    console.error("[translation] failed", {
      bookingId: booking.id,
      provider: providerName,
      error: error instanceof Error ? error.message : String(error),
    });
    return { status: "failed", provider: providerName };
  }
}

async function notify(booking: BookingRequestRow): Promise<void> {
  try {
    const notifier = getNotifier();
    const message = renderBookingNotification(booking, {
      development: notifier.name === "mock" || booking.translationProvider === "mock",
    });
    await notifier.send(message);
    await recordNotificationResult(booking.id, { ok: true });
  } catch (error) {
    const code =
      error instanceof NotificationError
        ? error.code
        : error instanceof Error
          ? error.message
          : String(error);
    console.error("[notification] failed", { bookingId: booking.id, error: code });
    await recordNotificationResult(booking.id, { ok: false, error: code });
  }
}
