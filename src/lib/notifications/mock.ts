import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NotificationMessage, Notifier } from "./types";

const OUTPUT_DIR = path.join(process.cwd(), ".notifications");

/**
 * DEVELOPMENT ONLY. Instead of sending, writes each notification to
 * `.notifications/` (git-ignored) so it can be opened in a browser.
 *
 * Set MOCK_NOTIFICATION_FAIL=true to simulate a sending failure.
 */
export class MockNotifier implements Notifier {
  readonly name = "mock";

  async send(message: NotificationMessage): Promise<void> {
    if (process.env.MOCK_NOTIFICATION_FAIL === "true") {
      throw new Error("Mock notification failure (MOCK_NOTIFICATION_FAIL=true)");
    }
    await mkdir(OUTPUT_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(OUTPUT_DIR, `${stamp}-${message.reference}.html`);
    await writeFile(file, message.html, "utf8");
    console.info(`[notification:mock] written ${path.relative(process.cwd(), file)}`);
  }
}
