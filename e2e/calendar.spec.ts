import { test, expect } from "@playwright/test";

test.describe("Calendar", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run auth tests");

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await expect(page.getByRole("link", { name: /new appointment/i })).toBeVisible({ timeout: 5000 });
  });

  test("can navigate to calendar", async ({ page }) => {
    await page.getByRole("link", { name: "Calendar" }).first().click();
    await expect(page).toHaveURL(/\/calendar/);
    await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  });

  test("calendar has month navigation", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await expect(page.getByRole("button", { name: /previous month/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /next month/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /today/i })).toBeVisible();
  });
});
