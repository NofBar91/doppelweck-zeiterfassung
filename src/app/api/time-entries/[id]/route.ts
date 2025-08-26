// ─────────────────────────────────────────────────────────────
// FILE: src/app/api/time-entries/[id]/route.ts
// ─────────────────────────────────────────────────────────────
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, canEditEntry } from "@/lib/authz";
import { TimeEntryUpdateSchema, TimeEntryStatusEnum } from "@/lib/validators/timeEntry";
import { calcDurationMin } from "@/lib/utils/time";
import { z } from "zod";

type Status = z.infer<typeof TimeEntryStatusEnum>;
function getStatus(entry: unknown): Status {
  const s = (entry as { status?: string } | null)?.status;
  return s === "SUBMITTED" || s === "APPROVED" || s === "REJECTED" ? s : "DRAFT";
}
function getLockedAt(entry: unknown): Date | null {
  const v = (entry as { lockedAt?: Date | null } | null)?.lockedAt;
  return v ?? null;
}

function employeeStatusAllowed(current: Status, target: Status) {
  return target === "SUBMITTED" && (current === "DRAFT" || current === "REJECTED");
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const id = params.id;
  const existing = await prisma.timeEntry.findUnique({ where: { id } });
  if (!existing) return new Response("Not found", { status: 404 });

  if (!canEditEntry(session, existing.userId)) return new Response("Forbidden", { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = TimeEntryUpdateSchema.safeParse(json);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });
  const patch = parsed.data;

  const currentStatus = getStatus(existing);
  const currentLockedAt = getLockedAt(existing);

  if (currentStatus === "APPROVED" && !isAdmin(session)) {
    return new Response("Eintrag ist freigegeben und gesperrt.", { status: 403 });
  }

  if (!isAdmin(session) && patch.status && !employeeStatusAllowed(currentStatus, patch.status)) {
    return new Response("Status-Änderung nicht erlaubt.", { status: 403 });
  }

  const nextStart = patch.startUtc ? new Date(patch.startUtc) : existing.startUtc;
  const nextEnd = patch.endUtc ? new Date(patch.endUtc) : existing.endUtc;

  let durationMin: number;
  try {
    durationMin = calcDurationMin(nextStart.toISOString(), nextEnd.toISOString());
    if (durationMin <= 0) return new Response("Ungültige Zeitspanne", { status: 400 });
    if (durationMin > 16 * 60) return new Response("Dauer zu lang", { status: 400 });
  } catch {
    return new Response("Ungültige Zeitspanne", { status: 400 });
  }

  if (patch.startUtc || patch.endUtc) {
    const overlap = await prisma.timeEntry.findFirst({
      where: {
        userId: existing.userId,
        id: { not: id },
        startUtc: { lt: nextEnd.toISOString() },
        endUtc: { gt: nextStart.toISOString() },
      },
    });
    if (overlap) return new Response("Zeit überschneidet sich mit bestehendem Eintrag", { status: 400 });
  }

  const data: {
    startUtc: Date;
    endUtc: Date;
    durationMin: number;
    workDate?: Date;
    location?: string;
    note?: string;
    status?: Status;
    lockedAt?: Date | null;
    editedByAdmin?: boolean;
  } = {
    startUtc: nextStart,
    endUtc: nextEnd,
    durationMin,
  };
  if (patch.workDate !== undefined) data.workDate = new Date(patch.workDate);
  if (patch.location !== undefined) data.location = patch.location;
  if (patch.note !== undefined) data.note = patch.note;

  if (patch.status) {
    data.status = patch.status;
    if (patch.status === "APPROVED") data.lockedAt = new Date();
    else if (patch.status === "REJECTED" || patch.status === "SUBMITTED") data.lockedAt = null;
  }

  if (isAdmin(session)) data.editedByAdmin = true;

  const updated = await prisma.timeEntry.update({ where: { id }, data });

  if (isAdmin(session)) {
    const beforeStatus = (existing as { status?: string } | null)?.status ?? null;
    const afterStatus = (updated as { status?: string } | null)?.status ?? null;
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        targetId: id,
        action: "UPDATE_TIME",
        diff: {
          before: {
            startUtc: existing.startUtc,
            endUtc: existing.endUtc,
            durationMin: existing.durationMin,
            location: existing.location,
            note: existing.note,
            status: beforeStatus,
            lockedAt: currentLockedAt,
          },
          after: {
            startUtc: updated.startUtc,
            endUtc: updated.endUtc,
            durationMin: updated.durationMin,
            location: updated.location,
            note: updated.note,
            status: afterStatus,
            lockedAt: getLockedAt(updated),
          },
        },
      },
    });
  }

  return Response.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const id = params.id;
  const existing = await prisma.timeEntry.findUnique({ where: { id } });
  if (!existing) return new Response("Not found", { status: 404 });

  if (!canEditEntry(session, existing.userId)) return new Response("Forbidden", { status: 403 });

  const existingStatus = getStatus(existing);
  if ((existingStatus === "APPROVED" || existingStatus === "SUBMITTED") && !isAdmin(session)) {
    return new Response("Freigegebene Einträge sind gesperrt und können nicht gelöscht werden.", { status: 403 });
  }

  await prisma.timeEntry.delete({ where: { id } });

  if (isAdmin(session)) {
    await prisma.auditLog.create({
      data: { actorId: session.user.id, targetId: id, action: "DELETE_TIME", diff: {} },
    });
  }

  return new Response(null, { status: 204 });
}
