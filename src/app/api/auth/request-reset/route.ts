// FILE: src/app/api/auth/request-reset/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResetRequestSchema } from "@/lib/validators/users"; // ← singular!
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ResetRequestSchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });

  // E-Mail leicht normalisieren
  const email = parsed.data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  // Immer 200 zurückgeben, um Enumeration zu vermeiden
  if (!user) return Response.json({ ok: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h

await (prisma as any).passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

  // Für DEV: Link in Konsole (in PROD per Mail verschicken)
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  console.log("RESET LINK:", `${base}/reset/${token}`);

  return Response.json({ ok: true });
}
