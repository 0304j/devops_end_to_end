import { prepareTestDatabase, testDatabaseUrl } from "../support/test-database.mts";

export default async function globalSetup() {
  await prepareTestDatabase(testDatabaseUrl());
}
