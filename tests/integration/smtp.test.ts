import type { AddressInfo } from "node:net";
import { SMTPServer } from "smtp-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SmtpNotifier } from "@/lib/notifications/smtp";
import { NotificationError } from "@/lib/notifications/types";

type Received = { user?: string; from?: string; to: string[]; raw: string };
const received: Received[] = [];

// A local SMTP server that accepts and records mail (no TLS, test only).
const server = new SMTPServer({
  authOptional: false,
  disabledCommands: ["STARTTLS"],
  allowInsecureAuth: true,
  onAuth(auth, _session, callback) {
    if (auth.username === "werkstatt" && auth.password === "geheim") {
      callback(null, { user: auth.username });
    } else {
      callback(new Error("Invalid credentials"));
    }
  },
  onData(stream, session, callback) {
    let raw = "";
    stream.on("data", (chunk) => (raw += chunk.toString()));
    stream.on("end", () => {
      received.push({
        user: session.user as string | undefined,
        from: session.envelope.mailFrom ? session.envelope.mailFrom.address : undefined,
        to: session.envelope.rcptTo.map((r) => r.address),
        raw,
      });
      callback();
    });
  },
});

let port = 0;
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.server.address() as AddressInfo).port;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const message = {
  subject: "طلب موعد جديد",
  html: '<html lang="ar" dir="rtl"><body>مرحبا</body></html>',
  text: "مرحبا",
  reference: "test",
};

const notifier = (password = "geheim", targetPort = port) =>
  new SmtpNotifier({
    host: "127.0.0.1",
    port: targetPort,
    user: "werkstatt",
    password,
    from: "AutoCare <termine@autocare-werkstatt.example>",
    to: "inhaber@autocare-werkstatt.example",
  });

describe("SmtpNotifier", () => {
  it("delivers an authenticated multipart e-mail", async () => {
    await notifier().send(message);
    const mail = received.at(-1)!;

    expect(mail.user).toBe("werkstatt");
    expect(mail.from).toBe("termine@autocare-werkstatt.example");
    expect(mail.to).toEqual(["inhaber@autocare-werkstatt.example"]);
    expect(mail.raw).toContain("multipart/alternative");
    // Arabic subject is MIME-encoded as UTF-8.
    expect(mail.raw).toMatch(/Subject: =\?UTF-8\?/i);
  });

  it("reports wrong credentials as a NotificationError without leaking them", async () => {
    const error = await notifier("falsch")
      .send(message)
      .catch((e) => e);
    expect(error).toBeInstanceOf(NotificationError);
    expect(error.code).toMatch(/EAUTH/);
    expect(error.message).not.toContain("falsch");
  });

  it("reports an unreachable server", async () => {
    const error = await notifier("geheim", 1)
      .send(message)
      .catch((e) => e);
    expect(error).toBeInstanceOf(NotificationError);
    expect(error.code).toMatch(/ESOCKET|ECONNECTION|ECONNREFUSED/);
  });
});
