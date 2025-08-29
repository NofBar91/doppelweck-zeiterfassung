import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// string-basierte Rollen + Guard
type RoleLiteral = "ADMIN" | "EMPLOYEE";
const ROLES = ["ADMIN", "EMPLOYEE"] as const;
function isRole(x: unknown): x is RoleLiteral {
  return typeof x === "string" && (ROLES as readonly string[]).includes(x);
}

// PATCH /api/admin/users/[id]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // Next 15.5: params ist ein Promise
) {
  const { id } = await context.params;

  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as Partial<{ name: string; role: unknown }>;

  // Prisma-versionssicher: benutze das 'data'-Typsubset
  const data: Prisma.UserUpdateArgs["data"] = {};

  if (typeof body?.name === "string") {
    // Name ist immer ein string – passt zu allen Versionen
    data.name = body.name as NonNullable<typeof data.name>;
  }

  if (isRole(body?.role)) {
    // Enum-Set über FieldUpdateOperationsInput – versionsrobust, kein $Enums nötig
    data.role = { set: body.role as never } as NonNullable<typeof data.role>;
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
