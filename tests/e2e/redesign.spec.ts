import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, admin = false) {
  await page.goto("/login");
  await page.getByLabel("E-Mail", { exact: true }).fill(admin ? "chef@example.com" : "max@example.com");
  await page.getByLabel("Passwort", { exact: true }).fill(admin ? "Admin!234" : "Mitarb!234");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("mobile driver: create, filter, edit, submit and lock a tour", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await expect(page.getByRole("navigation")).toContainText("Meine Zeiten");
  await page.getByRole("button", { name: "Neuer Eintrag" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Datum", { exact: true }).fill("2026-09-05");
  await dialog.getByLabel("Von", { exact: true }).fill("04:00");
  await dialog.getByLabel("Bis", { exact: true }).fill("08:30");
  await dialog.getByLabel("Ort", { exact: true }).fill("Beckingen QA");
  await dialog.getByLabel("Kilometer", { exact: true }).fill("48,5");
  await expect(dialog.getByText("04:30", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status")).toContainText("gespeichert");
  await page.getByLabel("Tour suchen").fill("Beckingen QA");
  const card = page.locator("article").filter({ hasText: "Beckingen QA" });
  await expect(card).toBeVisible();
  await noOverflow(page);
  await card.getByRole("button", { name: "Bearbeiten" }).click();
  await dialog.getByLabel("Ort", { exact: true }).fill("");
  await dialog.getByLabel("Kilometer", { exact: true }).fill("");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Keine passenden Touren")).toBeVisible();
  await page.getByLabel("Tour suchen").fill("");
  await page.getByLabel("Zeitraum", { exact: true }).fill("2026-09");
  await expect(page.locator("article").filter({ hasText: "05.09.2026" })).toContainText("—");
  await page.getByLabel("Monat", { exact: true }).fill("2026-09");
  page.once("dialog", d => d.accept());
  await page.getByRole("button", { name: "Monat einreichen", exact: true }).click();
  const submitted = page.locator("article").filter({ hasText: "05.09.2026" });
  await expect(submitted).toContainText("Eingereicht");
  await expect(submitted.getByRole("button", { name: "Bearbeiten" })).toBeDisabled();
  const records = await (await page.request.get("/api/time-entries")).json();
  const record = records.find((entry: { startUtc: string }) => entry.startUtc.startsWith("2026-09-05"));
  expect(record).toBeTruthy();
  expect((await page.request.patch(`/api/time-entries/${record.id}`, { data: { note: "Gesperrt" } })).status()).toBe(403);
  expect((await page.request.delete(`/api/time-entries/${record.id}`)).status()).toBe(403);
  await page.screenshot({ path: "test-results/screenshots/driver-mobile.png", fullPage: true });
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("admin: approve, export and navigate between management pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page, true);
  const created = await page.request.post("/api/time-entries", { data: { workDate: "2026-09-06T00:00:00.000Z", startUtc: "2026-09-06T02:00:00.000Z", endUtc: "2026-09-06T06:30:00.000Z", location: "Verwaltung QA", note: "48" } });
  expect(created.status()).toBe(201);
  const submitted = await page.request.post("/api/time-entries/submit", { data: { month: "2026-09" } });
  expect(submitted.status()).toBe(200);
  await page.getByRole("link", { name: "Arbeitszeiten", exact: true }).click();
  await page.getByLabel("Status", { exact: true }).selectOption("SUBMITTED");
  const row = page.getByRole("row").filter({ hasText: "Verwaltung QA" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Freigeben", exact: true }).click();
  await expect(row).not.toBeVisible();
  await page.getByLabel("Status", { exact: true }).selectOption("APPROVED");
  await expect(row).toContainText("Freigegeben");
  await noOverflow(page);
  await page.screenshot({ path: "test-results/screenshots/admin-desktop.png", fullPage: true });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Stundenübersicht generieren", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.csv$/);
  await page.getByRole("link", { name: "Mitarbeiter", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Unser Team" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Rolle für Max Mustermann" })).toHaveValue("EMPLOYEE");
  await page.screenshot({ path: "test-results/screenshots/team-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
});

test("account pages, password visibility, dialog keyboard handling and small screens", async ({ page }) => {
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Gute Tour");
    await noOverflow(page);
    await page.screenshot({ path: `test-results/screenshots/home-${width}.png`, fullPage: true });
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await noOverflow(page);
    await page.screenshot({ path: `test-results/screenshots/login-${width}.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "Passwort anzeigen", exact: true }).click();
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("link", { name: "Passwort vergessen?" }).click();
  await expect(page).toHaveURL(/\/forgot$/);
  await expect(page.getByLabel("E-Mail", { exact: true })).toHaveAttribute("type", "email");
  for (const route of ["/reset/qa-invalid-token", "/invite/qa-invalid-token"]) {
    await page.goto(route);
    await expect(page.getByLabel("Neues Passwort", { exact: true })).toHaveAttribute("minlength", "8");
    await noOverflow(page);
  }
  await login(page);
  const create = page.getByRole("button", { name: "Neuer Eintrag" });
  await create.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(create).toBeFocused();
});
