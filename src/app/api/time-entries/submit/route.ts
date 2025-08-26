// ─────────────────────────────────────────────────────────────
// FILE: src/app/api/time-entries/submit/route.ts
// ─────────────────────────────────────────────────────────────
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitMonthSchema } from "@/lib/validators/timeEntry";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = SubmitMonthSchema.safeParse(json);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });

  const { month } = parsed.data; // YYYY-MM
  const [y, m] = month.split("-").map(Number);

  // Monatsgrenzen in UTC (inklusive)
  const from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const to = new Date(Date.UTC(y, m, 0, 23, 59, 59));

  // Kandidaten ermitteln (DRAFT/REJECTED des Users im Monat)
  const candidates = await prisma.timeEntry.findMany({
    where: {
      userId: session.user.id,
      workDate: { gte: from, lte: to },
      status: { in: ["DRAFT", "REJECTED"] },
    },
    select: { id: true, status: true },
  });

  if (candidates.length === 0) {
    return Response.json({ month, updatedCount: 0, byStatus: { DRAFT: 0, REJECTED: 0 } });
  }

  const draftCount = candidates.filter(c => c.status === "DRAFT").length;
  const rejectedCount = candidates.filter(c => c.status === "REJECTED").length;

  // Alle passenden Einträge auf SUBMITTED setzen; lock entfernen
  const res = await prisma.timeEntry.updateMany({
    where: {
      userId: session.user.id,
      workDate: { gte: from, lte: to },
      status: { in: ["DRAFT", "REJECTED"] },
    },
    data: { status: "SUBMITTED", lockedAt: null },
  });

  return Response.json({
    month,
    updatedCount: res.count,
    byStatus: { DRAFT: draftCount, REJECTED: rejectedCount },
  });
}
