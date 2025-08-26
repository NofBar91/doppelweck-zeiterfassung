import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const email = "thorstenstoffel@web.de";
  const name = "Admin";
  const passwordHash = await bcrypt.hash("Admin!234", 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin existiert bereits.");
    return;
  }
  await prisma.user.create({
    data: { email, name, passwordHash, role: "ADMIN" },
  });
  console.log("Admin angelegt:", email);
}

main().finally(() => prisma.$disconnect());
