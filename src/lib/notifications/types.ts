export type NotificationMessage = {
  subject: string;
  html: string;
  /** Plain-text alternative for clients that do not render HTML. */
  text: string;
  /** Used for file names and logs only. Not personal data. */
  reference: string;
};

export interface Notifier {
  readonly name: string;
  /** Resolves once the provider accepted the message, otherwise throws a NotificationError. */
  send(message: NotificationMessage): Promise<void>;
}

/** Sending failure. `code` is safe to store and log (no addresses or content). */
export class NotificationError extends Error {
  constructor(
    readonly code: string,
    options?: { cause?: unknown },
  ) {
    super(`Notification failed: ${code}`, options);
    this.name = "NotificationError";
  }
}
