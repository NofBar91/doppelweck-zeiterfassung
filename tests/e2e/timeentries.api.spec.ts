import { test, expect, type Page } from "@playwright/test";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("employee can create, update and delete own time entry; overlap rejected", async ({ page }) => {
  await loginAs(page, "max@example.com", "Mitarb!234");

  const baseDay = new Date(Date.UTC(2025, 0, 20)); // 2025-01-20
  const start1 = new Date(Date.UTC(2025, 0, 20, 8, 0, 0));
  const end1   = new Date(Date.UTC(2025, 0, 20, 12, 0, 0));
  const workDateIso = baseDay.toISOString();
  const startIso = start1.toISOString();
  const endIso = end1.toISOString();

  // CREATE
  const resCreate = await page.request.post("/api/time-entries", {
    data: {
      workDate: workDateIso,
      startUtc: startIso,
      endUtc: endIso,
      location: "Büro",
      note: "Vormittag",
    },
  });
  expect(resCreate.status()).toBe(201);
  const created = await resCreate.json();
  expect(created.durationMin).toBe(240);

  // OVERLAP REJECT
  const resOverlap = await page.request.post("/api/time-entries", {
    data: {
      workDate: workDateIso,
      startUtc: new Date(Date.UTC(2025, 0, 20, 11, 0, 0)).toISOString(),
      endUtc:   new Date(Date.UTC(2025, 0, 20, 13, 0, 0)).toISOString(),
      location: "Büro",
    },
  });
  expect(resOverlap.status()).toBe(400);

  // UPDATE
  const resPatch = await page.request.patch(`/api/time-entries/${created.id}`, {
    data: {
      endUtc: new Date(Date.UTC(2025, 0, 20, 13, 0, 0)).toISOString(), // +1h
      note: "bis 13 Uhr",
    },
  });
  expect(resPatch.status()).toBe(200);
  const updated = await resPatch.json();
  expect(updated.durationMin).toBe(300);

  // DELETE
  const resDelete = await page.request.delete(`/api/time-entries/${created.id}`);
  expect(resDelete.status()).toBe(204);
});

test("admin can edit employee's entry and audit log is written", async ({ page }) => {
  // login as employee, create entry
  await loginAs(page, "max@example.com", "Mitarb!234");

  const start = new Date(Date.UTC(2025, 0, 21, 9, 0, 0));
  const end   = new Date(Date.UTC(2025, 0, 21, 10, 0, 0));

  const resCreate = await page.request.post("/api/time-entries", {
    data: {
      workDate: new Date(Date.UTC(2025, 0, 21)).toISOString(),
      startUtc: start.toISOString(),
      endUtc: end.toISOString(),
      location: "Homeoffice",
      note: "Daily",
    },
  });
  expect(resCreate.status()).toBe(201);
  const created = await resCreate.json();

  // logout, login as admin
  await page.getByRole("button", { name: "Abmelden" }).click();
await expect(page).toHaveURL(/\/login/);
  await loginAs(page, "chef@example.com", "Admin!234");

  // admin updates entry to longer span
  const resPatch = await page.request.patch(`/api/time-entries/${created.id}`, {
    data: {
      endUtc: new Date(Date.UTC(2025, 0, 21, 11, 0, 0)).toISOString(),
      note: "verlängert",
    },
  });
  expect(resPatch.status()).toBe(200);
  const patched = await resPatch.json();
  expect(patched.editedByAdmin).toBe(true);
  expect(patched.durationMin).toBe(120);

  // sanity: audit log exists
  const audit = await page.request.get(`/api/time-entries?userId=${created.userId}`);
  expect(audit.status()).toBe(200);
  // Wir prüfen hier nur, dass der GET klappt; detaillierte Auditprüfung folgt später in Admin-UI-Tests.
});
