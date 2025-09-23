import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const AcceptInviteSchema = z.object({
  token: z.string().min(10),
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = AcceptInviteSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid payload", details: parsed.error.flatten() }), { status: 400 });
  }
  const { token, email, name, password } = parsed.data;

  // 1) Invite holen
  const invite = await prisma.inviteToken.findUnique({ where: { token } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return new Response(JSON.stringify({ error: "Einladung ungültig oder abgelaufen." }), { status: 400 });
  }

  // 2) Falls User existiert, verweigern (oder E-Mail angleichen)
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return new Response(JSON.stringify({ error: "E-Mail ist bereits registriert." }), { status: 409 });
  }

  // 3) User anlegen
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: invite.role, // Rolle aus Einladung
    },
  });

  // 4) Invite verbrauchen
  await prisma.inviteToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return Response.json({ ok: true });
}
