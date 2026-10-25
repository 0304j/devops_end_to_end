import { prepareTestDatabase, testDatabaseUrl } from "./test-database.mts";

// Runs once in the main Vitest process, where process.env still holds the
// development DATABASE_URL, so resolve the test database explicitly.
export default async function setup() {
  await prepareTestDatabase(testDatabaseUrl());
}
