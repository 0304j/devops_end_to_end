"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  applyTransition,
  rescheduleBooking,
  resetForRetry,
  transitions,
} from "@/lib/admin/bookings";
import { DUMMY_HASH, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getAdminUser } from "@/lib/auth/session";
import { isBookableSlot } from "@/lib/booking/availability";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { processBookingNotification } from "@/lib/notifications/process-booking";
import {
  clearRateLimit,
  clientIp,
  hashIdentifier,
  isRateLimited,
  recordRateLimitEvent,
} from "@/lib/security/rate-limit";

export type ActionState =
  { status: "idle" } | { status: "ok"; message: string } | { status: "error"; message: string };

// ---------------------------------------------------------------------------
// Login / logout
// ---------------------------------------------------------------------------

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

export async function login(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Bitte E-Mail und Passwort eingeben." };
  }
  const { email, password } = parsed.data;

  const emailKey = `login:email:${hashIdentifier(email)}`;
  const ipKey = `login:ip:${hashIdentifier(await clientIp())}`;
  const loginWindow = { windowMs: LOGIN_WINDOW_MS };
  if (
    (await isRateLimited(emailKey, { ...loginWindow, limit: MAX_FAILURES_PER_EMAIL })) ||
    (await isRateLimited(ipKey, { ...loginWindow, limit: MAX_FAILURES_PER_IP }))
  ) {
    return {
      status: "error",
      message: "Zu viele fehlgeschlagene Anmeldeversuche. Bitte warten Sie 15 Minuten.",
    };
  }

  const [user] = await db
    .select({ id: adminUsers.id, passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(eq(adminUsers.email, email));

  // Always run the hash comparison so unknown e-mails take as long as wrong passwords.
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    await recordRateLimitEvent(emailKey);
    await recordRateLimitEvent(ipKey);
    return { status: "error", message: "E-Mail oder Passwort ist falsch." };
  }

  await clearRateLimit(emailKey);
  await createSession(user.id);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Booking management. Every action re-checks the session: Server Actions are
// public HTTP endpoints and must not rely on the page being protected.
// ---------------------------------------------------------------------------

const idSchema = z.uuid();

async function authorized(): Promise<ActionState | null> {
  return (await getAdminUser())
    ? null
    : { status: "error", message: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an." };
}

const transitionMessages = {
  confirm: "Termin bestätigt.",
  reject: "Anfrage abgelehnt.",
  cancel: "Termin storniert.",
} as const;

export async function changeBookingStatus(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await authorized();
  if (denied) return denied;

  const parsed = z
    .object({
      id: idSchema,
      transition: z.enum(Object.keys(transitions) as [keyof typeof transitions]),
    })
    .safeParse({ id: formData.get("id"), transition: formData.get("transition") });
  if (!parsed.success) return { status: "error", message: "Ungültige Anfrage." };

  const changed = await applyTransition(parsed.data.id, parsed.data.transition);
  refresh();
  return changed
    ? { status: "ok", message: transitionMessages[parsed.data.transition] }
    : {
        status: "error",
        message: "Der Status wurde inzwischen geändert. Die Ansicht ist aktualisiert.",
      };
}

export async function moveBooking(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await authorized();
  if (denied) return denied;

  const parsed = z
    .object({ id: idSchema, slot: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/) })
    .safeParse({ id: formData.get("id"), slot: formData.get("slot") });
  if (!parsed.success) return { status: "error", message: "Bitte einen neuen Termin wählen." };

  const [date, time] = parsed.data.slot.split("T");
  if (!isBookableSlot(date, time)) {
    return { status: "error", message: "Dieser Termin liegt außerhalb der buchbaren Zeiten." };
  }

  const result = await rescheduleBooking(parsed.data.id, date, time);
  refresh();
  switch (result) {
    case "ok":
      return { status: "ok", message: "Termin verschoben." };
    case "slot_taken":
      return { status: "error", message: "Dieser Termin ist bereits belegt." };
    default:
      return { status: "error", message: "Dieser Termin kann nicht mehr verschoben werden." };
  }
}

export async function resendNotification(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await authorized();
  if (denied) return denied;

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "Ungültige Anfrage." };

  await resetForRetry(id.data);
  await processBookingNotification(id.data);
  refresh();
  return { status: "ok", message: "Benachrichtigung erneut verarbeitet." };
}
