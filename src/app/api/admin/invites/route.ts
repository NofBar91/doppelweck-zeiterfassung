import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const CreateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8),         // Passwort direkt setzen
  role: z.enum(["ADMIN", "EMPLOYEE"]).default("EMPLOYEE"),
});

// GET /api/admin/invites
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const invites = await prisma.inviteToken.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json(invites);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });
  const { name, email, password, role } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return new Response("User exists", { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name: name ?? "", email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return Response.json(user, { status: 201 });
}

// DELETE /api/admin/invites?id=...
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  await prisma.inviteToken.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
