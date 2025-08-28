import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { InviteCreateSchema } from "@/lib/validators/users";
import crypto from "crypto";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const invites = await prisma.inviteToken.findMany({
    where: { invitedById: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { invitedBy: { select: { id: true, name: true, email: true } } },
  });

  return Response.json(invites);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = InviteCreateSchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });

  const { email, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return new Response("User exists", { status: 409 });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const invite = await prisma.inviteToken.create({
    data: { email, role, token, expiresAt, invitedById: session.user.id },
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  console.log("INVITE LINK:", `${base}/invite/${token}`);

  return Response.json(invite, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  try {
    await prisma.inviteToken.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e: unknown) {
    return new Response(errMsg(e), { status: 400 });
  }
}
