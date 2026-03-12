import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page has sign up link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  });

  test("signup page has sign in link", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });
});
