// FILE: src/app/api/admin/users/[id]/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Type Guard für Prisma-Fehler (ohne any)
function isPrismaError(e: unknown, code: string): e is { code: string; message: string } {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: unknown }).code === code;
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return new Response("Not found", { status: 404 });

  try {
    await prisma.user.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e: unknown) {
    // FK verletzt (z. B. vorhandene TimeEntries) -> P2003
    if (isPrismaError(e, "P2003")) {
      return new Response(
        "Nutzer kann nicht gelöscht werden, weil noch Zeit-Einträge existieren.",
        { status: 409 }
      );
    }
    console.error(e);
    return new Response("Delete failed", { status: 500 });
  }
}

// PUT /api/admin/users/[id]  (Name/Rolle ändern)
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as { name?: unknown; role?: unknown } | null;
  if (!body) return new Response("Invalid payload", { status: 400 });

  const data: { name?: string; role?: Role } = {};
  if (typeof body.name === "string") data.name = body.name;
  if (body.role === "ADMIN" || body.role === "EMPLOYEE") data.role = body.role as Role;

  if (Object.keys(data).length === 0) return new Response("Nothing to update", { status: 400 });

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return Response.json(updated);
}
