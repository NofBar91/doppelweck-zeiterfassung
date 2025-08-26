// Kleine Hilfsfunktionen für CSV-Export
export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const head = headers.map(csvEscape).join(";");
  const body = rows.map(r => r.map(csvEscape).join(";")).join("\n");
  // BOM voranstellen, damit Excel Umlaute korrekt erkennt
  return "\uFEFF" + head + "\n" + body + "\n";
}
