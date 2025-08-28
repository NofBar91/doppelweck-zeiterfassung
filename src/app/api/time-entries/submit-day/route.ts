import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitDaySchema } from "@/lib/validators/timeEntry";
import { Prisma, TimeEntryStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = SubmitDaySchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });

  const { date } = parsed.data; // YYYY-MM-DD
  const [y, m, d] = date.split("-").map(Number);

  const from = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const to   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

  const whereWorkDate: Prisma.TimeEntryWhereInput = {
    userId: session.user.id,
    workDate: { gte: from, lte: to },
    status: { in: [TimeEntryStatus.DRAFT, TimeEntryStatus.REJECTED] },
  };
  const resWorkDate = await prisma.timeEntry.updateMany({
    where: whereWorkDate,
    data: { status: TimeEntryStatus.SUBMITTED, lockedAt: null },
  });

  let resStartUtcCount = 0;
  if (resWorkDate.count === 0) {
    const whereStartUtc: Prisma.TimeEntryWhereInput = {
      userId: session.user.id,
      startUtc: { gte: from, lte: to },
      status: { in: [TimeEntryStatus.DRAFT, TimeEntryStatus.REJECTED] },
    };
    const resStartUtc = await prisma.timeEntry.updateMany({
      where: whereStartUtc,
      data: { status: TimeEntryStatus.SUBMITTED, lockedAt: null },
    });
    resStartUtcCount = resStartUtc.count;
  }

  const updatedCount = resWorkDate.count + resStartUtcCount;
  return Response.json({ date, updatedCount });
}
