// prisma/seed/seed.ts
import { prisma } from '../../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const passwordAdmin = await bcrypt.hash('Admin!234', 10);
  const passwordEmp   = await bcrypt.hash('Mitarb!234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'chef@example.com' },
    update: {},
    create: {
      email: 'chef@example.com',
      name: 'Chef',
      role: 'ADMIN',
      passwordHash: passwordAdmin,
    },
  });

  const emp = await prisma.user.upsert({
    where: { email: 'max@example.com' },
    update: {},
    create: {
      email: 'max@example.com',
      name: 'Max Mustermann',
      role: 'EMPLOYEE',
      passwordHash: passwordEmp,
    },
  });

  // Beispiel-Eintrag
  const start = new Date(Date.UTC(2025, 0, 15, 8, 0, 0)); // 15.01.2025 08:00 UTC
  const end   = new Date(Date.UTC(2025, 0, 15, 16, 30, 0));
  const durationMin = Math.round((+end - +start) / 60000);

  await prisma.timeEntry.create({
    data: {
      userId: emp.id,
      workDate: new Date(Date.UTC(2025, 0, 15)),
      startUtc: start,
      endUtc: end,
      durationMin,
      location: 'Büro Berlin',
      note: 'Onboarding & Setup',
    },
  });

  console.log('Seed fertig:', { admin: admin.email, emp: emp.email });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
