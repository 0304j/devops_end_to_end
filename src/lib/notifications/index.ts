import "server-only";
import { MockNotifier } from "./mock";
import { SmtpNotifier } from "./smtp";
import type { Notifier } from "./types";

export type { Notifier } from "./types";

/**
 * Returns the notifier selected by NOTIFICATION_PROVIDER.
 *
 *   NOTIFICATION_PROVIDER=mock   writes HTML files to .notifications/ (development)
 *   NOTIFICATION_PROVIDER=smtp   sends e-mail; needs SMTP_* and NOTIFY_EMAIL_TO
 */
export function getNotifier(): Notifier {
  const provider = process.env.NOTIFICATION_PROVIDER;
  switch (provider) {
    case "mock":
      return new MockNotifier();
    case "smtp":
      return new SmtpNotifier({
        host: required("SMTP_HOST"),
        port: Number(process.env.SMTP_PORT ?? 587),
        user: process.env.SMTP_USER || undefined,
        password: process.env.SMTP_PASSWORD || undefined,
        from: required("SMTP_FROM"),
        to: required("NOTIFY_EMAIL_TO"),
      });
    case undefined:
    case "":
      throw new Error("NOTIFICATION_PROVIDER is not set (mock or smtp)");
    default:
      throw new Error(`Unknown NOTIFICATION_PROVIDER "${provider}"`);
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`NOTIFICATION_PROVIDER=smtp requires ${name}`);
  return value;
}
