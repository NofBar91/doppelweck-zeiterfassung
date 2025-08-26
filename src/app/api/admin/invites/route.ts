import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { InviteCreateSchema } from "@/lib/validators/users";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const invites = await (prisma as any).inviteToken.findMany({
    where: { invitedById: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json(invites);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = InviteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid payload", { status: 400 });
  }

  const { email, role } = parsed.data;

  // Bestehende Nutzer abfangen
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return new Response("User exists", { status: 409 });
  }

  // Token 32 Byte
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 Tage gültig

  const invite = await (prisma as any).inviteToken.create({
    data: {
      email,
      role,
      token,
      expiresAt,
      invitedById: session.user.id,
    },
  });

  // DEV: Link in Konsole (SMTP kommt später)
  console.log(
    "INVITE LINK:",
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/invite/${token}`
  );

  return Response.json(invite, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  await (prisma as any).inviteToken.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
