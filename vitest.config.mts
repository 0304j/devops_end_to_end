import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./tests/support/test-database.mts";

/** Only the integration project needs a database; unit tests must run without one. */
function integrationDatabaseUrl(): string {
  try {
    return testDatabaseUrl();
  } catch {
    return "";
  }
}

const alias = {
  "@": path.resolve(import.meta.dirname, "src"),
  "server-only": path.resolve(import.meta.dirname, "tests/support/empty-module.ts"),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          env: { TZ: "America/New_York" }, // proves nothing depends on the machine's time zone
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/support/integration-global-setup.ts"],
          setupFiles: ["tests/support/integration-setup.ts"],
          // Tests share one database, so files run one after another.
          fileParallelism: false,
          env: {
            DATABASE_URL: integrationDatabaseUrl(),
            AUTH_SECRET: "test-secret",
            TRANSLATION_PROVIDER: "mock",
            NOTIFICATION_PROVIDER: "mock",
            MOCK_NOTIFICATION_DIR: path.join(tmpdir(), "autocare-test-notifications"),
          },
        },
      },
    ],
  },
});
