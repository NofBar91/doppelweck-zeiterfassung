"use client";
import React from "react";
import { minutesToHHMM, isoToLocalDateInput, isoToLocalTimeInput } from "@/lib/timezone";
import { toCSV } from "@/lib/csv";

type User = { id: string; name: string | null; email: string | null; role: string };
type Entry = {
  id: string;
  userId: string;
  workDate: string;
  startUtc: string;
  endUtc: string;
  durationMin: number;
  location?: string | null;
  note?: string | null;
  editedByAdmin: boolean;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  user?: { id: string; name: string | null; email: string | null };
};

function sumMinutes(rows: Entry[]) { return rows.reduce((a, b) => a + (b.durationMin || 0), 0); }
function errMsg(e: unknown) { return e instanceof Error ? e.message : "Unbekannter Fehler"; }

export default function AdminEntriesClient() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [usersError, setUsersError] = React.useState<string | null>(null);

  const [filters, setFilters] = React.useState<{ userId?: string; from?: string; to?: string; location?: string; status?: string }>({});
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [edit, setEdit] = React.useState<{ date: string; start: string; end: string; location: string; note: string } | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setLoadingUsers(true); setUsersError(null);
        const res = await fetch("/api/users", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        setUsers(await res.json());
      } catch (e: unknown) { setUsersError(errMsg(e)); }
      finally { setLoadingUsers(false); }
    })();
  }, []);

  const load = React.useCallback(async () => {
    setError(null); setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (filters.userId) sp.set("userId", filters.userId);
      if (filters.from) sp.set("from", new Date(`${filters.from}T00:00:00`).toISOString());
      if (filters.to) sp.set("to", new Date(`${filters.to}T23:59:59`).toISOString());
      if (filters.location) sp.set("location", filters.location);
      if (filters.status) sp.set("status", filters.status);
      const res = await fetch(`/api/time-entries?admin=1&${sp.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      setEntries(await res.json());
    } catch (e: unknown) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, [filters]);

  React.useEffect(() => { void load(); }, [load]);

  function startEdit(e: Entry) {
    setEditingId(e.id);
    setEdit({
      date: isoToLocalDateInput(e.startUtc),
      start: isoToLocalTimeInput(e.startUtc),
      end: isoToLocalTimeInput(e.endUtc),
      location: e.location ?? "",
      note: e.note ?? "",
    });
  }

  async function saveEdit(id: string) {
    if (!edit) return;
    try {
      const start = new Date(`${edit.date}T${edit.start}:00`).toISOString();
      const end = new Date(`${edit.date}T${edit.end}:00`).toISOString();
      const workDate = new Date(`${edit.date}T00:00:00`).toISOString();

      const res = await fetch(`/api/time-entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startUtc: start, endUtc: end, workDate, location: edit.location, note: edit.note }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditingId(null); setEdit(null); await load();
    } catch (e: unknown) { alert(errMsg(e) || "Speichern fehlgeschlagen"); }
  }
  function cancelEdit() { setEditingId(null); setEdit(null); }

  async function handleDelete(id: string) {
    if (confirmId !== id) { setConfirmId(id); return; }
    try {
      const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setConfirmId(null); await load();
    } catch (e: unknown) { alert(errMsg(e) || "Löschen fehlgeschlagen"); }
  }

  async function setStatus(id: string, status: Entry["status"]) {
    try {
      const res = await fetch(`/api/time-entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (e: unknown) { alert(errMsg(e) || "Status-Änderung fehlgeschlagen"); }
  }

  const total = minutesToHHMM(sumMinutes(entries));

  function downloadTextFile(filename: string, text: string) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a);
    a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const headers = ["Datum","Mitarbeiter","Von","Bis","Dauer","Ort","Kilometer","Status","Admin*"];
    const rows = entries.map(e => {
      const date = new Date(e.startUtc).toLocaleDateString();
      const start = new Date(e.startUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const end   = new Date(e.endUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const duration = minutesToHHMM(e.durationMin);
      const user = e.user?.name ?? e.user?.email ?? e.userId;
      const status = (e as Partial<Entry>).status ?? "DRAFT";
      return [date, user, start, end, duration, e.location ?? "", e.note ?? "", status, e.editedByAdmin ? "*" : ""];
    });

      // Gesamtstunden
      const totalMin = sumMinutes(entries);
      const totalStr = minutesToHHMM(totalMin);

      // Summe aller Zahlen in der Notiz-Spalte
      const noteSum = entries.reduce((sum, e) => {
        const note = String(e.note ?? "").replace(",", "."); // Komma → Punkt
        const match = note.match(/-?\d+(\.\d+)?/); // erste Zahl im Text finden
        if (match) {
          const val = parseFloat(match[0]);
          if (!isNaN(val)) {
            return sum + val;
          }
        }
        return sum;
      }, 0);

      // Summenzeile anhängen
      rows.push([]);
      rows.push(["", "", "", "Gesamt:", totalStr, "", noteSum.toString() + " KM", "", ""]);

    const csv = toCSV(headers, rows);
    const stamp = new Date().toISOString().slice(0,10);
    downloadTextFile(`arbeitszeiten_${stamp}.csv`, csv);
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div>
          <label htmlFor="filter-user" className="block text-sm mb-1">Mitarbeiter</label>
          <select id="filter-user" className="w-full border rounded px-3 py-2 bg-black text-white" value={filters.userId || ""}
            onChange={(e)=> setFilters(f=>({...f, userId: e.target.value || undefined}))} disabled={loadingUsers}>
            <option value="">Alle</option>
            {users.map(u=> <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}
          </select>
          {usersError && <p className="text-red-600 text-sm">Mitarbeiter konnten nicht geladen werden: {usersError}</p>}
        </div>
        <div>
          <label htmlFor="filter-from" className="block text-sm mb-1">Von</label>
          <input id="filter-from" type="date" className="w-full border rounded px-3 py-2"
            value={filters.from || ""} onChange={(e)=> setFilters(f=>({...f, from: e.target.value || undefined}))}/>
        </div>
        <div>
          <label htmlFor="filter-to" className="block text-sm mb-1">Bis</label>
          <input id="filter-to" type="date" className="w-full border rounded px-3 py-2"
            value={filters.to || ""} onChange={(e)=> setFilters(f=>({...f, to: e.target.value || undefined}))}/>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="filter-location" className="block text-sm mb-1">Ort enthält</label>
          <input id="filter-location" className="w-full border rounded px-3 py-2" placeholder="z. B. Büro"
            value={filters.location || ""} onChange={(e)=> setFilters(f=>({...f, location: e.target.value || undefined}))}/>
        </div>
        <div>
          <label htmlFor="filter-status" className="block text-sm mb-1">Status</label>
          <select id="filter-status" className="w-full border rounded px-3 py-2 bg-black text-white" value={filters.status || ""}
            onChange={(e)=> setFilters(f=>({...f, status: e.target.value || undefined}))}>
            <option value="">Alle</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Summe: <b>{total} h</b> ({entries.length} Einträge)</p>
        <div className="flex items-center gap-2">
          <button onClick={()=>load()} className="rounded-2xl px-3 py-2 border">Aktualisieren</button>
          <button onClick={()=> setFilters({})} className="rounded-2xl px-3 py-2 border">Zurücksetzen</button>
          <button onClick={exportCsv} className="rounded-2xl px-3 py-2 border">CSV export</button>
        </div>
      </div>

      {loading && <p>Daten werden geladen…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {entries.length > 0 && !loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Datum</th>
                <th className="py-2 pr-4">Mitarbeiter</th>
                <th className="py-2 pr-4">Von</th>
                <th className="py-2 pr-4">Bis</th>
                <th className="py-2 pr-4">Dauer</th>
                <th className="py-2 pr-4">Ort</th>
                <th className="py-2 pr-4">Kilometer</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Admin</th>
                <th className="py-2 pr-4">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => {
                const date = new Date(e.startUtc).toLocaleDateString();
                const start = isoToLocalTimeInput(e.startUtc);
                const end = isoToLocalTimeInput(e.endUtc);
                const duration = minutesToHHMM(e.durationMin);
                const isEditing = editingId === e.id;
                const editable = e.status !== "APPROVED";
                return (
                  <tr key={e.id} className="border-b align-top">
                    <td className="py-2 pr-4 whitespace-nowrap">{date}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{e.user?.name ?? e.user?.email ?? e.userId}</td>
                    <td className="py-2 pr-4">
                      {isEditing ? (
                        <input aria-label="Von" type="time" className="border rounded px-2 py-1"
                          value={edit?.start || start} onChange={(ev)=> setEdit(s=> s ? ({...s, start: ev.target.value}) : s)} />
                      ) : start}
                    </td>
                    <td className="py-2 pr-4">
                      {isEditing ? (
                        <input aria-label="Bis" type="time" className="border rounded px-2 py-1"
                          value={edit?.end || end} onChange={(ev)=> setEdit(s=> s ? ({...s, end: ev.target.value}) : s)} />
                      ) : end}
                    </td>
                    <td className="py-2 pr-4">{duration}</td>
                    <td className="py-2 pr-4 max-w-[12rem]">
                      {isEditing ? (
                        <input aria-label="Ort" className="border rounded px-2 py-1 w-full"
                          value={edit?.location || ""} onChange={(ev)=> setEdit(s=> s ? ({...s, location: ev.target.value}) : s)} />
                      ) : <span title={e.location ?? ""} className="truncate inline-block max-w-[12rem]">{e.location}</span>}
                    </td>
                    <td className="py-2 pr-4 max-w-[16rem]">
                      {isEditing ? (
                        <input aria-label="Kilometer" className="border rounded px-2 py-1 w-full"
                          value={edit?.note || ""} onChange={(ev)=> setEdit(s=> s ? ({...s, note: ev.target.value}) : s)} />
                      ) : <span title={e.note ?? ""} className="truncate inline-block max-w-[16rem]">{e.note}</span>}
                    </td>
                    <td className="py-2 pr-4">{e.status}</td>
                    <td className="py-2 pr-4">{e.editedByAdmin ? "✱" : ""}</td>
                    <td className="py-2 pr-4 space-x-2 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button className="underline" onClick={()=>saveEdit(e.id)}>Speichern</button>
                          <button className="underline" onClick={cancelEdit}>Abbrechen</button>
                        </>
                      ) : (
                        <>
                          <button className="underline" onClick={()=>startEdit(e)} disabled={!editable}
                            aria-disabled={!editable} title={!editable ? "Freigegebene Einträge sind gesperrt" : undefined}>
                            Bearbeiten
                          </button>
                          {e.status !== "APPROVED" && (
                            <button className="underline" onClick={()=> setStatus(e.id, "APPROVED")}>Freigeben</button>
                          )}
                          {e.status !== "REJECTED" && (
                            <button className="underline" onClick={()=> setStatus(e.id, "REJECTED")}>Ablehnen</button>
                          )}
                          {confirmId === e.id ? (
                            <>
                              <button className="text-red-600 underline" onClick={()=>handleDelete(e.id)}>Löschen bestätigen</button>
                              <button className="underline" onClick={()=>setConfirmId(null)}>Abbrechen</button>
                            </>
                          ) : (
                            <button className="text-red-600 underline" onClick={()=>setConfirmId(e.id)}>Löschen</button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && entries.length === 0 && <p className="text-gray-600">Keine Einträge für die aktuellen Filter.</p>}
    </div>
  );
}
