// ─────────────────────────────────────────────────────────────
// FILE: src/app/api/users/route.ts (ADMIN: Liste der Mitarbeiter)
// ─────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


export async function GET() {
const session = await getServerSession(authOptions);
if (!session || session.user.role !== "ADMIN") return new Response("Unauthorized", { status: 401 });


const users = await prisma.user.findMany({
select: { id: true, name: true, email: true, role: true },
orderBy: [{ name: "asc" }],
});
return Response.json(users);
}