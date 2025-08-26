// ─────────────────────────────────────────────────────────────
// FILE: src/lib/timezone.ts
// ─────────────────────────────────────────────────────────────
export function toUtcIso(dateStr: string, timeStr: string) {
// dateStr: YYYY-MM-DD, timeStr: HH:MM (lokal)
const local = new Date(`${dateStr}T${timeStr}:00`);
return local.toISOString();
}


export function dateOnlyUtcIso(dateStr: string) {
const localMidnight = new Date(`${dateStr}T00:00:00`);
return localMidnight.toISOString();
}


export function minutesToHHMM(total: number) {
const h = Math.floor(total / 60).toString().padStart(2, "0");
const m = (total % 60).toString().padStart(2, "0");
return `${h}:${m}`;
}


export function isoToLocalDateInput(iso: string) {
const d = new Date(iso);
const y = d.getFullYear();
const m = (d.getMonth() + 1).toString().padStart(2, "0");
const day = d.getDate().toString().padStart(2, "0");
return `${y}-${m}-${day}`;
}


export function isoToLocalTimeInput(iso: string) {
const d = new Date(iso);
const hh = d.getHours().toString().padStart(2, "0");
const mm = d.getMinutes().toString().padStart(2, "0");
return `${hh}:${mm}`;
}