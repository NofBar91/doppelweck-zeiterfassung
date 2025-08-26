import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResetPerformSchema } from "@/lib/validators/users";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ResetPerformSchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });

  const { token, password } = parsed.data;
  const rec = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
    return new Response("Invalid or expired token", { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: rec.userId },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.update({
    where: { id: rec.id },
    data: { usedAt: new Date() },
  });

  return Response.json({ ok: true });
}
