import { test, expect } from "@playwright/test";

test("redirect to login when unauthenticated", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("login as employee and see dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill("max@example.com");
  await page.getByLabel("Passwort").fill("Mitarb!234");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/Rolle:\s*EMPLOYEE/)).toBeVisible();
});
