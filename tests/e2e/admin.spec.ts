import { expect, type Page, test } from "@playwright/test";
import {
  createAdmin,
  E2E_ADMIN,
  fillBookingForm,
  openBookingForm,
  query,
  resetDatabase,
  submitBooking,
} from "./helpers";

test.beforeEach(async () => {
  await resetDatabase();
  await createAdmin(E2E_ADMIN.email, E2E_ADMIN.password);
});

async function login(page: Page, password = E2E_ADMIN.password) {
  await page.goto("/admin/login");
  await page.getByLabel("E-Mail").fill(E2E_ADMIN.email);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Anmelden" }).click();
}

test("redirects to the login page without a session", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("rejects a wrong password", async ({ page }) => {
  await login(page, "falsch");
  await expect(page.locator("form [role=alert]")).toHaveText("E-Mail oder Passwort ist falsch.");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("owner sees a new request with contact details and confirms it", async ({ page }) => {
  await openBookingForm(page);
  await fillBookingForm(page, { name: "Hans Beispiel" });
  await submitBooking(page);

  await login(page);
  await expect(page).toHaveURL(/\/admin$/);
  const card = page.locator("article", { hasText: "Hans Beispiel" });
  await expect(card).toBeVisible();
  await expect(card.getByRole("link", { name: "030 987654" })).toHaveAttribute(
    "href",
    "tel:030987654",
  );
  await expect(card.locator('p[lang="de"]')).toHaveText("Beim Bremsen quietscht es vorne links.");

  await card.getByRole("button", { name: "Bestätigen" }).click();
  await expect(page.getByText("Termin bestätigt.")).toBeVisible();
  expect(await query("select status from booking_requests")).toEqual([{ status: "confirmed" }]);

  await page.getByRole("button", { name: "Abmelden" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(await query("select token_hash from admin_sessions")).toHaveLength(0);
});
