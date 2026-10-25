import nodemailer, { type Transporter } from "nodemailer";
import { NotificationError, type NotificationMessage, type Notifier } from "./types";

export type SmtpConfig = {
  host: string;
  port: number;
  user?: string;
  password?: string;
  from: string;
  to: string;
};

/** Sends notifications as e-mail through any SMTP server. */
export class SmtpNotifier implements Notifier {
  readonly name = "smtp";
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      // Port 465 uses implicit TLS; other ports upgrade with STARTTLS.
      secure: config.port === 465,
      auth: config.user ? { user: config.user, pass: config.password } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  async send(message: NotificationMessage): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: this.config.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    } catch (error) {
      // SMTP error messages can echo addresses; keep only the error code.
      const { code, responseCode } = (error ?? {}) as { code?: string; responseCode?: number };
      throw new NotificationError(
        [code ?? "SMTP_ERROR", responseCode].filter(Boolean).join(" "),
        { cause: error },
      );
    }
  }
}
