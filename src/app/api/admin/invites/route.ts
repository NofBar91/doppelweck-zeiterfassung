// src/app/api/admin/invites/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { InviteCreateSchema } from "@/lib/validators/users";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

/**
 * GET /api/admin/invites
 * Liste offener Einladungen (nur Admin)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const invites = await prisma.inviteToken.findMany({
    orderBy: { createdAt: "desc" },
    // select: { id: true, email: true, role: true, token: true, createdAt: true, expiresAt: true, usedAt: true },
  });

  return Response.json(invites);
}

/**
 * POST /api/admin/invites
 * Neue Einladung anlegen (nur Admin).
 * Body: { email: string, role: "ADMIN" | "EMPLOYEE" }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    /* leer lassen – Schema liefert sauberen Fehler */
  }

  const parsed = InviteCreateSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.flatten();
    return Response.json({ error: "Invalid payload", details }, { status: 400 });
  }

  const { email, role } = parsed.data;

  // Nutzer existiert schon?
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return new Response("User exists", { status: 409 });

  // Alte offene Einladungen zu dieser Mail aufräumen (optional)
  await prisma.inviteToken.deleteMany({ where: { email } });

  // Token erzeugen & speichern
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 Tage

  const invite = await prisma.inviteToken.create({
    data: { email, role, token, expiresAt },
  });

  // E-Mail versenden (oder Konsole, wenn kein Provider konfiguriert)
  try {
    await sendEmail(email, token);
  } catch (e) {
    console.error("Invite e-mail sending failed:", e);
  }

  return Response.json({ ok: true, invite });
}

/**
 * DELETE /api/admin/invites?id=INVITE_ID
 * Einladung widerrufen (nur Admin)
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  await prisma.inviteToken.delete({ where: { id } });
  return new Response(null, { status: 204 });
}