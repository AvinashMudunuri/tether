import type { Page } from "@playwright/test";

/**
 * Dismiss the notification onboarding modal if it's visible.
 * The modal blocks all pointer events and causes E2E click failures.
 */
export async function dismissOnboardingModal(page: Page): Promise<void> {
  const continueBtn = page.getByRole("button", { name: "Continue" });
  try {
    await continueBtn.click({ timeout: 5000 });
    await page.waitForSelector('[role="dialog"]', { state: "hidden", timeout: 10000 });
  } catch {
    // Modal may not be present (user already completed onboarding)
  }
}
