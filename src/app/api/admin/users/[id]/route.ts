import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

// PATCH /api/admin/users/[id]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as Partial<{ name: string; role: Role }>;
  const data: { name?: string; role?: Role } = {};

  if (typeof body?.name === "string") data.name = body.name;
  if (body?.role && (body.role === "ADMIN" || body.role === "EMPLOYEE")) {
    data.role = body.role;
  }

  const user = await prisma.user.update({ where: { id }, data });
  return Response.json(user);
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  await prisma.user.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
