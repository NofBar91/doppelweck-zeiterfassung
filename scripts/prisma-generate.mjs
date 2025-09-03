// scripts/prisma-generate.mjs
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const schema = process.env.PRISMA_SCHEMA_PATH || "prisma/schema.prisma";

if (!existsSync(schema)) {
  console.error(
    `\n[prisma-generate] Schema-Datei nicht gefunden: ${schema}\n` +
    `Entweder PRISMA_SCHEMA_PATH korrekt setzen oder 'prisma/schema.prisma' anlegen.\n`
  );
  process.exit(1);
}

console.log(`[prisma-generate] Verwende Schema: ${schema}`);
execSync(`npx prisma generate --schema "${schema}"`, { stdio: "inherit" });
