import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return new Response("Unauthorized", { status: 401 });

  const { id } = await context.params;

  // Nur offene (nicht benutzte) Einladungen löschen – optional:
  // await prisma.inviteToken.deleteMany({ where: { id, usedAt: null } });

  const existing = await prisma.inviteToken.findUnique({ where: { id } });
  if (!existing) return new Response("Not found", { status: 404 });

  await prisma.inviteToken.delete({ where: { id } });
  return new Response(null, { status: 204 });
}