// ─────────────────────────────────────────────────────────────
// FILE: src/app/api/time-entries/[id]/route.ts
// ─────────────────────────────────────────────────────────────
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, canEditEntry } from "@/lib/authz";
import { TimeEntryUpdateSchema } from "@/lib/validators/timeEntry";
import { calcDurationMin } from "@/lib/utils/time";
import type { Prisma, TimeEntryStatus as TES } from "@prisma/client";

// Darf ein Nicht-Admin den Status auf den Zielstatus setzen?
function employeeStatusAllowed(current: TES, target: TES) {
  // Mitarbeiter darf nur DRAFT/REJECTED -> SUBMITTED
  return target === "SUBMITTED" && (current === "DRAFT" || current === "REJECTED");
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // Next 15.5: params als Promise
) {
  const { id } = await context.params;

  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const existing = await prisma.timeEntry.findUnique({ where: { id } });
  if (!existing) return new Response("Not found", { status: 404 });

  // Darf der Nutzer (oder Admin) diesen Eintrag bearbeiten?
  if (!canEditEntry(session, existing.userId)) return new Response("Forbidden", { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = TimeEntryUpdateSchema.safeParse(json);
  if (!parsed.success) return new Response("Invalid payload", { status: 400 });
  const patch = parsed.data;

  const currentStatus = (existing.status ?? "DRAFT") as TES;

  // Eingereichte und freigegebene Zeiten bleiben bis zur Rückgabe gesperrt.
  if ((currentStatus === "SUBMITTED" || currentStatus === "APPROVED") && !isAdmin(session)) {
    return new Response("Eintrag ist eingereicht oder freigegeben und gesperrt.", { status: 403 });
  }

  // Nicht-Admin darf Status nur DRAFT/REJECTED -> SUBMITTED wechseln
  if (!isAdmin(session) && patch.status && !employeeStatusAllowed(currentStatus, patch.status as TES)) {
    return new Response("Status-Änderung nicht erlaubt.", { status: 403 });
  }

  // Zeiten (nur wenn gesendet)
  const nextStart = patch.startUtc ? new Date(patch.startUtc) : existing.startUtc;
  const nextEnd   = patch.endUtc   ? new Date(patch.endUtc)   : existing.endUtc;

  // Dauer validieren
  let durationMin: number;
  try {
    durationMin = calcDurationMin(nextStart.toISOString(), nextEnd.toISOString());
    if (durationMin <= 0) return new Response("Ungültige Zeitspanne", { status: 400 });
    if (durationMin > 16 * 60) return new Response("Dauer zu lang", { status: 400 });
  } catch {
    return new Response("Ungültige Zeitspanne", { status: 400 });
  }

  // Overlap-Check (nur falls Zeiten geändert wurden)
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

  // Update-Daten TYPSTARK aufbauen
  const data: Prisma.TimeEntryUpdateInput = {
    startUtc: nextStart,
    endUtc: nextEnd,
    durationMin, // number genügt (Prisma: number | IntFieldUpdateOperationsInput)
  };

  if (patch.workDate !== undefined) data.workDate = new Date(patch.workDate);
  if (patch.location !== undefined) data.location = patch.location ?? "";
  if (patch.note !== undefined) data.note = patch.note ?? "";

  // Statuswechsel & Lock sauber typisiert
  if (patch.status) {
    const s = patch.status as TES;
    data.status = s; // <- WICHTIG: Enum-Typ, kein string
    data.lockedAt = s === "APPROVED" ? new Date() : s === "SUBMITTED" ? null : null;
  }

  if (isAdmin(session)) data.editedByAdmin = true;

  const updated = await prisma.timeEntry.update({ where: { id }, data });

  // Audit für Admin (ohne any)
  if (isAdmin(session)) {
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
            status: existing.status,
          },
          after: {
            startUtc: updated.startUtc,
            endUtc: updated.endUtc,
            durationMin: updated.durationMin,
            location: updated.location,
            note: updated.note,
            status: updated.status,
          },
        },
      },
    });
  }

  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const existing = await prisma.timeEntry.findUnique({ where: { id } });
  if (!existing) return new Response("Not found", { status: 404 });
  if (!canEditEntry(session, existing.userId)) return new Response("Forbidden", { status: 403 });

  if (!isAdmin(session) && (existing.status === "SUBMITTED" || existing.status === "APPROVED")) {
    return new Response("Eintrag ist eingereicht oder freigegeben und gesperrt.", { status: 403 });
  }

  await prisma.timeEntry.delete({ where: { id } });

  if (isAdmin(session)) {
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        targetId: id,
        action: "DELETE_TIME",
        diff: {}, // Pflichtfeld im Schema
      },
    });
  }

  return new Response(null, { status: 204 });
}
