import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as Partial<{ name: string; role: "ADMIN" | "EMPLOYEE" }>;
  if (!body || (typeof body.name !== "string" && body.role !== "ADMIN" && body.role !== "EMPLOYEE")) {
    return new Response("Invalid payload", { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        ...(typeof body.name === "string" ? { name: body.name } : {}),
        ...(body.role ? { role: body.role } : {}),
      },
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return new Response("Not found", { status: 404 });
    }
    console.error("PUT /admin/users/[id] failed:", e);
    return new Response("Server error", { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const { id } = await context.params;

  if (session.user.id === id) {
    return new Response("Du kannst dich nicht selbst löschen.", { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2003") {
        return new Response(
          "Nutzer kann nicht gelöscht werden, weil noch verknüpfte Daten existieren (z. B. Zeiteinträge).",
          { status: 409 }
        );
      }
      if (e.code === "P2025") {
        return new Response("Not found", { status: 404 });
      }
    }
    console.error("DELETE /admin/users/[id] failed:", e);
    return new Response("Server error", { status: 500 });
  }
}
