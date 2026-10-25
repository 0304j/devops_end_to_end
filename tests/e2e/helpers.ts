import { expect, type Page } from "@playwright/test";
import pg from "pg";
import { hashPassword } from "../../src/lib/auth/password";
import { testDatabaseUrl, truncateAll } from "../support/test-database.mts";

export const E2E_ADMIN = {
  email: "e2e-admin@autocare-werkstatt.example",
  password: "E2E-Passwort-2026!",
};

export async function resetDatabase() {
  await truncateAll(testDatabaseUrl());
}

export async function query<T extends pg.QueryResultRow>(sql: string, params: unknown[] = []) {
  const client = new pg.Client({ connectionString: testDatabaseUrl() });
  await client.connect();
  try {
    return (await client.query<T>(sql, params)).rows;
  } finally {
    await client.end();
  }
}

export async function createAdmin(email: string, password: string) {
  await query("insert into admin_users (email, password_hash) values ($1, $2)", [
    email,
    await hashPassword(password),
  ]);
}

/** Opens /termin and waits until the streamed form is interactive. */
export async function openBookingForm(page: Page) {
  await page.goto("/termin");
  await expect(page.getByRole("group", { name: "Tag" })).toBeVisible();
}

/** Fills the booking form with valid data, choosing the first free slot of the given day. */
export async function fillBookingForm(
  page: Page,
  { dayIndex = 0, name = "Erika Mustermann" } = {},
) {
  await page.getByLabel("Bremsen").check();
  await page.locator('input[name="booking-date"]').nth(dayIndex).check({ force: true });
  await page.locator('input[name="booking-time"]:not(:disabled)').first().check({ force: true });
  await page.getByLabel("Marke").fill("Volkswagen");
  await page.getByLabel("Modell").fill("Golf");
  await page
    .getByLabel("Was sollen wir uns ansehen?")
    .fill("Beim Bremsen quietscht es vorne links.");
  await page.getByLabel("Vor- und Nachname").fill(name);
  await page.getByLabel("Telefon").fill("030 987654");
  await page.getByLabel("E-Mail").fill("erika@example.com");
  await page.getByRole("checkbox").check();
}

export async function submitBooking(page: Page) {
  await page.getByRole("button", { name: "Terminanfrage senden" }).click();
  await expect(page.getByRole("heading", { name: /Vielen Dank/ })).toBeVisible();
}
