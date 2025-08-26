import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitDaySchema } from "@/lib/validators/timeEntry";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = SubmitDaySchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });

  // YYYY-MM-DD
  const { date } = parsed.data;
  const [y, m, d] = date.split("-").map(Number);

  // UTC-Grenzen des Tages
  const from = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const to   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

  // 1) Versuch: über workDate (dein "Tagesanker")
  const resWorkDate = await prisma.timeEntry.updateMany({
    where: {
      userId: session.user.id,
      workDate: { gte: from, lte: to },
      // Cast bis der Prisma-Client die Typen sicher kennt
      ...( { status: { in: ["DRAFT", "REJECTED"] } } as any ),
    },
    data: ( { status: "SUBMITTED", lockedAt: null } as any ),
  });

  // 2) Falls nichts aktualisiert wurde: zusätzlich über startUtc im Tagesbereich
  let resStartUtcCount = 0;
  if (resWorkDate.count === 0) {
    const resStartUtc = await prisma.timeEntry.updateMany({
      where: {
        userId: session.user.id,
        startUtc: { gte: from, lte: to },
        ...( { status: { in: ["DRAFT", "REJECTED"] } } as any ),
      },
      data: ( { status: "SUBMITTED", lockedAt: null } as any ),
    });
    resStartUtcCount = resStartUtc.count;
  }

  const updatedCount = resWorkDate.count + resStartUtcCount;
  return Response.json({ date, updatedCount });
}
