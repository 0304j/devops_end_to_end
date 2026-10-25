import { expect, test } from "@playwright/test";
import { fillBookingForm, openBookingForm, query, resetDatabase, submitBooking } from "./helpers";

test.beforeEach(async () => {
  await resetDatabase();
});

test("landing page leads to the booking form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Ehrliche Arbeit an Ihrem Auto.",
  );
  await page.getByRole("link", { name: "Termin vereinbaren" }).first().click();
  await expect(page).toHaveURL(/\/termin$/);
  await expect(page.getByRole("heading", { name: "Termin anfragen" })).toBeVisible();
});

test("shows an error summary for an empty form", async ({ page }) => {
  await page.goto("/termin");
  await page.getByRole("button", { name: "Terminanfrage senden" }).click();

  const summary = page.getByRole("heading", { name: "Bitte prüfen Sie Ihre Angaben" });
  await expect(summary).toBeVisible();
  await expect(page.getByText("Leistung: Bitte wählen Sie eine Leistung.")).toBeVisible();
  expect(await query("select id from booking_requests")).toHaveLength(0);
});

test("stores a booking request and marks the slot as taken", async ({ page }) => {
  await openBookingForm(page);
  await fillBookingForm(page);
  const slot = await page.locator('input[name="booking-time"]:checked').getAttribute("value");
  await submitBooking(page);

  await expect(page.getByText("Das ist noch keine Terminbestätigung.")).toBeVisible();
  const rows = await query<{ customer_name: string; status: string }>(
    "select customer_name, status from booking_requests",
  );
  expect(rows).toEqual([{ customer_name: "Erika Mustermann", status: "requested" }]);

  // The background notification runs after the response.
  await expect
    .poll(
      async () =>
        (await query<{ s: string }>("select notification_status as s from booking_requests"))[0].s,
    )
    .toBe("sent");

  await openBookingForm(page);
  await page.locator('input[name="booking-date"]').first().check({ force: true });
  await expect(page.locator(`input[name="booking-time"][value="${slot}"]`)).toBeDisabled();
});
