// ─────────────────────────────────────────────────────────────
// FILE: tests/e2e/admin.ui.spec.ts (E2E: Filter + Inline-Edit)
// ─────────────────────────────────────────────────────────────
import { test, expect, type Page } from "@playwright/test";


async function loginAs(page: Page, email: string, password: string) {
await page.goto("/login");
await page.getByLabel("E-Mail").fill(email);
await page.getByLabel("Passwort", { exact: true }).fill(password);
await page.getByRole("button", { name: "Anmelden", exact: true }).click();
await expect(page).toHaveURL(/\/dashboard/);
}


test("Admin filtert nach Mitarbeiter und editiert Eintrag inline", async ({ page }) => {
// Vorbereiten: Als Employee einen Eintrag anlegen
await loginAs(page, "max@example.com", "Mitarb!234");
await page.goto("/dashboard");
await page.getByRole("button", { name: "Neuer Eintrag" }).click();
await page.getByRole("dialog").getByLabel("Datum", { exact: true }).fill("2025-01-23");
await page.getByLabel("Von").fill("09:00");
await page.getByLabel("Bis").fill("10:00");
await page.getByLabel("Ort").fill("Admin-Check");
await page.getByRole("button", { name: "Speichern" }).click();
await expect(page.locator("table").getByText("Admin-Check")).toBeVisible();


// Logout -> Admin Login
await page.getByRole("button", { name: "Abmelden" }).click();
await expect(page).toHaveURL(/\/login/);
await loginAs(page, "chef@example.com", "Admin!234");


// Admin-Seite öffnen
await page.goto("/admin/entries");


// Mitarbeiter-Dropdown wählen (Max)
const employeeOption = await page.getByRole('option', { name: /Max Mustermann|max@example.com/i }).first();
const value = await employeeOption.getAttribute('value');
if (value) {
await page.getByLabel('Mitarbeiter').selectOption(value);
}


// Filter anwenden (optional Refresh klicken)
await page.getByRole('button', { name: 'Aktualisieren' }).click();


// Admin-Check Zeile finden und bearbeiten
const row = page.getByRole('row', { name: /Admin-Check/ });
await expect(row).toBeVisible();
await row.getByRole('button', { name: 'Bearbeiten' }).click();
await row.getByLabel('Bis').fill('11:30');
await row.getByRole('button', { name: 'Speichern' }).click();


// Dauer sollte jetzt 02:30 sein und Admin-Flag ✱ erscheinen
await expect(row.getByText('02:30')).toBeVisible();
await expect(row.getByText('✱')).toBeVisible();
});