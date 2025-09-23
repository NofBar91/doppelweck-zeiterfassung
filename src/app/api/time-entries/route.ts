import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TimeEntryCreateSchema } from "@/lib/validators/timeEntry";
import { calcDurationMin } from "@/lib/utils/time";
import { isAdmin } from "@/lib/authz";
import type { Prisma, TimeEntryStatus as TES } from "@prisma/client";

// String-Literal-Guard für Query-Param
type StatusLiteral = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
const STATUSES: readonly StatusLiteral[] = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"] as const;
function isStatus(x: string): x is StatusLiteral {
  return (STATUSES as readonly string[]).includes(x);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const adminView = isAdmin(session) && searchParams.get("admin") === "1";

  const where: Prisma.TimeEntryWhereInput = adminView ? {} : { userId: session.user.id };

  if (adminView) {
    const userId = searchParams.get("userId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const location = searchParams.get("location");
    const statusParam = searchParams.get("status");

    if (userId) where.userId = userId;
    if (from || to) {
      where.startUtc = {};
      if (from) where.startUtc.gte = from;
      if (to) where.startUtc.lte = to;
    }
    if (location) where.location = { contains: location }; // kein mode

    // Wichtig: Prisma erwartet hier den Enum-WERT direkt
    if (statusParam && isStatus(statusParam)) {
      where.status = statusParam as TES;
    }
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ workDate: "desc" }, { startUtc: "desc" }],
  });

  return Response.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = TimeEntryCreateSchema.safeParse(json);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });

  const { workDate, startUtc, endUtc, location, note } = parsed.data;

  const start = new Date(startUtc);
  const end = new Date(endUtc);

  let durationMin: number;
  try {
    durationMin = calcDurationMin(start.toISOString(), end.toISOString());
    if (durationMin <= 0) return new Response("Ungültige Zeitspanne", { status: 400 });
    if (durationMin > 24 * 60) return new Response("Dauer zu lang", { status: 400 });
  } catch {
    return new Response("Ungültige Zeitspanne", { status: 400 });
  }

  const overlap = await prisma.timeEntry.findFirst({
    where: {
      userId: session.user.id,
      startUtc: { lt: end.toISOString() },
      endUtc: { gt: start.toISOString() },
    },
  });
  if (overlap) return new Response("Zeit überschneidet sich mit bestehendem Eintrag", { status: 400 });

  // Status nicht setzen → DB-Default (DRAFT) greift
  const created = await prisma.timeEntry.create({
    data: {
      userId: session.user.id,
      workDate: new Date(workDate),
      startUtc: start,
      endUtc: end,
      durationMin,
      location: location ?? "",
      note: note ?? "",
      editedByAdmin: false,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return Response.json(created, { status: 201 });
}