import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/authz";
import { toCSV } from "@/lib/csv";
import { NextRequest } from "next/server";
import { minutesToHHMM } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!isAdmin(session)) return new Response("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const location = searchParams.get("location") ?? undefined;

  const where: Record<string, unknown> = {};
  if (userId) (where as any).userId = userId;
  if (from || to) {
    (where as any).startUtc = {};
    if (from) (where as any).startUtc.gte = from;
    if (to) (where as any).startUtc.lte = to;
  }
  if (location) (where as any).location = { contains: location, mode: "insensitive" };

  const entries = await prisma.timeEntry.findMany({
    where: where as any,
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ workDate: "asc" }, { startUtc: "asc" }],
  });

  const headers = ["Datum","Mitarbeiter","Von","Bis","Dauer (HH:MM)","Ort","Notiz","Admin geändert"];
  const rows = entries.map(e => {
    const date = new Date(e.workDate).toLocaleDateString();
    const start = new Date(e.startUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const end = new Date(e.endUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const emp = e.user?.name ?? e.user?.email ?? e.userId;
    return [date, emp, start, end, minutesToHHMM(e.durationMin), e.location ?? "", e.note ?? "", e.editedByAdmin ? "ja" : "nein"];
  });

  const csv = toCSV(headers, rows);
  const filename = `zeitnachweise_${new Date().toISOString().slice(0,10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
