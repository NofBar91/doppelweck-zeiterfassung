import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Lokaler Union-Typ + Type Guard statt import { Role } from "@prisma/client"
type RoleLiteral = "ADMIN" | "EMPLOYEE";
const ROLES = ["ADMIN", "EMPLOYEE"] as const;
function isRole(x: unknown): x is RoleLiteral {
  return typeof x === "string" && (ROLES as readonly string[]).includes(x);
}

// PATCH /api/admin/users/[id]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // Next 15.5: params als Promise
) {
  const { id } = await context.params;

  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as Partial<{ name: string; role: unknown }>;

  const data: Prisma.UserUpdateInput = {};

  if (typeof body?.name === "string") {
    data.name = body.name;
  }
  if (isRole(body?.role)) {
    // Prisma erwartet hier den Enum-Typ; wir casten typsicher ohne 'any'
    data.role = body.role as unknown as Prisma.UserUpdateInput["role"];
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
