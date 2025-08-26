import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/authz";
import { UpdateUserSchema } from "@/lib/validators/users";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!isAdmin(session)) return new Response("Forbidden", { status: 403 });

  const id = params.id;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return new Response("Not found", { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = UpdateUserSchema.safeParse(json);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });
  const patch = parsed.data;

  const data: any = {};
  if (patch.name !== undefined) data.name = patch.name || ""; // required string in schema
  if (patch.role !== undefined) data.role = patch.role;
  if (patch.password !== undefined) data.passwordHash = await bcrypt.hash(patch.password, 10);

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return Response.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!isAdmin(session)) return new Response("Forbidden", { status: 403 });

  const id = params.id;

  // Schutz: nicht den eigenen Account löschen
  if (id === session.user.id) {
    return new Response("Du kannst deinen eigenen Account nicht löschen.", { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return new Response("Not found", { status: 404 });

  // Prüfen, ob noch Zeiteinträge existieren
  const entries = await prisma.timeEntry.count({ where: { userId: id } });
  if (entries > 0) {
    return new Response("Benutzer hat noch Zeiteinträge und kann nicht gelöscht werden.", { status: 409 });
  }

  await prisma.user.delete({ where: { id } });

  // (Optional) Audit-Log, falls du ein entsprechendes Modell nutzt:
  // await prisma.auditLog.create({
  //   data: { actorId: session.user.id, targetId: id, action: "DELETE_USER", diff: {} },
  // });

  return new Response(null, { status: 204 });
}
