import { test, expect } from "@playwright/test";

test.describe("Tasks", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run auth tests");

    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await expect(page.getByRole("link", { name: /new appointment/i })).toBeVisible({ timeout: 5000 });
  });

  test("can navigate to tasks page", async ({ page }) => {
    await page.getByRole("link", { name: "Tasks" }).click();
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  });

  test("can add task", async ({ page }) => {
    await page.goto("/dashboard/tasks");
    const taskTitle = `E2E Test Task ${Date.now()}`;
    await page.getByPlaceholder("Add a task...").fill(taskTitle);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: taskTitle })).toBeVisible({ timeout: 5000 });
  });
});
