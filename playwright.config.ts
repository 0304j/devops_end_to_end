import { defineConfig, devices } from "@playwright/test";
import { testDatabaseUrl } from "./tests/support/test-database.mts";

/**
 * End-to-end tests against a production build (`npm run build` first).
 * The app runs on port 3200 with the test database and mock providers.
 */
const PORT = 3200;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1, // tests share one database
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    timezoneId: "Europe/Berlin",
    locale: "de-DE",
  },
  projects: [
    {
      name: "chromium",
      // Locally use the installed Chrome; CI installs Playwright's Chromium.
      use: { ...devices["Desktop Chrome"], channel: isCI ? undefined : "chrome" },
    },
  ],
  webServer: {
    // Same standalone server as in the Docker image. Explicit env below wins
    // over .env.local (Node's --env-file never overrides existing variables).
    command: "npm start",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      DATABASE_URL: testDatabaseUrl(),
      AUTH_SECRET: "e2e-secret",
      COOKIE_SECURE: "false",
      TRANSLATION_PROVIDER: "mock",
      NOTIFICATION_PROVIDER: "mock",
      MOCK_NOTIFICATION_DIR: "test-results/notifications",
    },
  },
});
