import { test, expect } from "@playwright/test";

test.describe("Appointments", () => {
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

  test("dashboard shows new appointment button", async ({ page }) => {
    await expect(page.getByRole("link", { name: "New Appointment" })).toBeVisible();
  });

  test("can navigate to new appointment form", async ({ page }) => {
    await page.getByRole("link", { name: "New Appointment" }).click();
    await expect(page).toHaveURL(/\/appointments\/new/);
    await expect(page.locator("#title")).toBeVisible();
  });

  test("can create appointment", async ({ page }) => {
    await page.getByRole("link", { name: /new appointment/i }).click();
    await expect(page).toHaveURL(/\/appointments\/new/);
    await page.getByLabel(/title/i).fill("E2E Test Appointment");
    await page.locator("#date").fill("2026-12-31");
    await page.locator("#time").fill("14:00");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page).toHaveURL(/\/appointments\/[^/]+$/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /E2E Test Appointment/i })).toBeVisible({ timeout: 10000 });
  });
});
