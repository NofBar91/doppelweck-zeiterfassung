import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ResetPerformSchema = z.object({
  token: z.string().min(1, "Token fehlt"),
  password: z.string().min(8, "Passwort zu kurz"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ResetPerformSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid payload", { status: 400 });
  }

  const { token, password } = parsed.data;

  // Token nachschlagen
  const rec = await prisma.passwordResetToken.findUnique({ where: { token } });

  // Nur Existenz + Ablaufdatum prüfen (kein usedAt im Schema)
  if (!rec || rec.expiresAt < new Date()) {
    return new Response("Invalid or expired token", { status: 400 });
  }

  // Passwort setzen
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: rec.userId },
    data: { passwordHash },
  });

  // Token single-use machen
  await prisma.passwordResetToken.delete({ where: { token } });

  return Response.json({ ok: true });
}
