import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/authz";
import { CreateUserDirectSchema } from "@/lib/validators/users";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!isAdmin(session)) return new Response("Forbidden", { status: 403 });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: [{ createdAt: "desc" }],
  });

  return Response.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!isAdmin(session)) return new Response("Forbidden", { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = CreateUserDirectSchema.safeParse(json);
  if (!parsed.success) {
    return new Response("Invalid payload", { status: 400 });
  }
  const { name, email, role, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return new Response("E-Mail existiert bereits", { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.user.create({
  data: {
    name: name ?? "",          // ← immer string liefern
    email,
    role,
    passwordHash,
  },
  select: { id: true, name: true, email: true, role: true, createdAt: true },
});

  return Response.json(user, { status: 201 });
}
