// ─────────────────────────────────────────────────────────────
// FILE: tests/e2e/employee.ui.spec.ts
// ─────────────────────────────────────────────────────────────
import { test, expect, type Page } from "@playwright/test";


async function loginAs(page: Page, email: string, password: string) {
await page.goto("/login");
await page.getByLabel("E-Mail").fill(email);
await page.getByLabel("Passwort", { exact: true }).fill(password);
await page.getByRole("button", { name: "Anmelden", exact: true }).click();
await expect(page).toHaveURL(/\/dashboard/);
}


function pick(date: Date) {
const y = date.getFullYear();
const m = String(date.getMonth() + 1).padStart(2, "0");
const d = String(date.getDate()).padStart(2, "0");
return `${y}-${m}-${d}`;
}


test("Employee kann Eintrag anlegen, bearbeiten und löschen (UI)", async ({ page }) => {
await loginAs(page, "max@example.com", "Mitarb!234");


// Neu anlegen
await page.getByRole("button", { name: "Neuer Eintrag" }).click();
const when = new Date(Date.UTC(2025, 0, 22));
await page.getByRole("dialog").getByLabel("Datum", { exact: true }).fill(pick(when));
await page.getByLabel("Von").fill("08:00");
await page.getByLabel("Bis").fill("10:30");
await page.getByLabel("Ort").fill("Testbüro");
await page.getByLabel("Kilometer").fill("E2E UI Test");
await page.getByRole("button", { name: "Speichern" }).click();


// Eintrag sollte in der Tabelle erscheinen
await expect(page.locator("table").getByText("Testbüro")).toBeVisible();
await expect(page.locator("table").getByText("E2E UI Test")).toBeVisible();


// Bearbeiten
await page.getByRole("row").filter({ hasText: "Testbüro" }).getByRole("button", { name: "Bearbeiten" }).click();
await page.getByLabel("Bis").fill("11:00");
await page.getByRole("button", { name: "Speichern" }).click();


// Dauer ändert sich auf 03:00 in der Liste (08:00–11:00)
await expect(page.locator("table").getByText("03:00")).toBeVisible();


// Löschen
await page.getByRole("row").filter({ hasText: "Testbüro" }).getByRole("button", { name: "Löschen", exact: true }).click();
await page.getByRole("button", { name: "Löschen bestätigen" }).first().click();


// Eintrag verschwunden (Notiz nicht mehr sichtbar)
await expect(page.locator("table").getByText("E2E UI Test")).toHaveCount(0);
});