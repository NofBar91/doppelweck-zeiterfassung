// scripts/prisma-generate.mjs
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

function log(...args) { console.log("[prisma-generate]", ...args); }
function fail(msg) { console.error("[prisma-generate] ❌", msg); process.exit(1); }

// 1) Eingestellter Schema-Pfad (z.B. über Vercel Env)
const envPath = process.env.PRISMA_SCHEMA_PATH?.trim();

// 2) Standard-Kandidaten
const candidates = [
  envPath,
  "prisma/schema.postgres.prisma", // bevorzugt in Vercel
  "prisma/schema.sqlite.prisma"   // Fallback (lokal/dev)
].filter(Boolean);

// 3) Ersten existenten Pfad wählen
const chosen = candidates.find(p => existsSync(p));

log("VERCEL =", process.env.VERCEL ? "yes" : "no");
log("CWD    =", process.cwd());
log("Env PRISMA_SCHEMA_PATH =", envPath || "(not set)");
log("Candidates:", candidates.join(", "));

if (!chosen) {
  fail(`Kein Prisma-Schema gefunden. Erwartet eines von: ${candidates.join(" | ")}`);
}

log("Verwende Schema:", chosen);

// 4) Prisma CLI via npx robust aufrufen (installiert bei Bedarf selbst)
try {
  execSync(`npx --yes prisma generate --schema "${path.normalize(chosen)}"`, { stdio: "inherit" });
  log("✅ prisma generate erfolgreich");
} catch (err) {
  fail(`prisma generate fehlgeschlagen: ${(err && err.message) || err}`);
}
