// src/lib/utils/time.ts
export function calcDurationMin(startIsoUtc: string, endIsoUtc: string) {
  const start = Date.parse(startIsoUtc);
  const end = Date.parse(endIsoUtc);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new Error('Ungültiges ISO-Datum');
  }
  const diffMin = Math.round((end - start) / 60000);
  if (diffMin <= 0) throw new Error('Ende muss nach Start liegen');
  return diffMin;
}

/** Prüft, ob sich zwei [start,end)-Intervalle überschneiden */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}
