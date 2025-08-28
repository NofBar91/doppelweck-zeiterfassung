import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResetRequestSchema } from "@/lib/validators/users";
import crypto from "crypto";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ResetRequestSchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Kein User? trotzdem 200 → keine Enumeration
    if (!user) return Response.json({ ok: true });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    console.log("RESET LINK:", `${base}/reset/${token}`);

    return Response.json({ ok: true });
  } catch (e: unknown) {
    return new Response(errMsg(e), { status: 500 });
  }
}
