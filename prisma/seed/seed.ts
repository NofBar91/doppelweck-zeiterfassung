import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@develop.com";
  const password = "Admin!234";
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin existiert bereits:", existing.email);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name: "Chef",
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log("Admin angelegt:", email);
}

main().finally(() => prisma.$disconnect());