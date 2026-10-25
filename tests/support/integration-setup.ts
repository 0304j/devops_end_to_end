import { afterAll, beforeEach } from "vitest";
import { closeDb } from "@/lib/db";
import { truncateAll } from "./test-database.mts";

beforeEach(async () => {
  await truncateAll(process.env.DATABASE_URL!);
});

afterAll(async () => {
  await closeDb();
});
