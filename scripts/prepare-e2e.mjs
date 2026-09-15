import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";

// Disposable test database only. The production schema and prisma/dev.db are untouched.
const testRoot = path.resolve(".e2e");
await mkdir(testRoot, { recursive: true });
await rm(path.join(testRoot, "e2e.db"), { force: true });
const schema = (await readFile("prisma/schema.sqlite.prisma", "utf8"))
  .replace('provider = "prisma-client-js"', `provider = "prisma-client-js"\n  output = ${JSON.stringify(path.resolve("node_modules/.prisma/client"))}`)
  .replace('file:./dev.db', 'file:./e2e.db');
const schemaPath = path.join(testRoot, "schema.prisma");
await writeFile(schemaPath, schema);
await writeFile(path.join(testRoot, "e2e.db"), "");
execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "db", "push", "--schema", schemaPath], { stdio: "inherit", env: { ...process.env, PRISMA_GENERATE_SKIP_AUTOINSTALL: "1" } });
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
try {
  for (const [email, name, role, password] of [
    ["max@example.com", "Max Mustermann", "EMPLOYEE", "Mitarb!234"],
    ["chef@example.com", "Carsten Ewen", "ADMIN", "Admin!234"],
  ]) {
    await prisma.user.create({ data: { email, name, role, passwordHash: await bcrypt.hash(password, 10) } });
  }
  console.log("Disposable E2E database prepared.");
} finally { await prisma.$disconnect(); }
