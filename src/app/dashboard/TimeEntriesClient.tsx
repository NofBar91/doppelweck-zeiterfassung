"use client";
import React from "react";
import {
  minutesToHHMM,
  toUtcIso,
  dateOnlyUtcIso,
  isoToLocalDateInput,
  isoToLocalTimeInput,
} from "@/lib/timezone";

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
  createdAt: string;
  updatedAt: string;
  status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  user?: { id: string; name: string | null; email: string | null };
};

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e); }

function useEntries() {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/time-entries", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data: Entry[] = await res.json();
      setEntries(data);
    } catch (e: unknown) {
      setError(errMsg(e) || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  return { entries, setEntries, loading, error, reload: load };
}

type FormState = {
  mode: "create" | "edit";
  id?: string;
  date: string;
  start: string;
  end: string;
  location: string;
  note: string;
};

function defaultForm(): FormState {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  return { mode: "create", date: `${yyyy}-${mm}-${dd}`, start: "08:00", end: "16:00", location: "", note: "" };
}

export default function TimeEntriesClient() {
  const { entries, setEntries, loading, error, reload } = useEntries();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(defaultForm());
  const [busy, setBusy] = React.useState(false);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const durationMin = React.useMemo(() => {
    try {
      const s = new Date(`${form.date}T${form.start}:00`);
      const e = new Date(`${form.date}T${form.end}:00`);
      const diff = Math.round((+e - +s) / 60000);
      return diff > 0 ? diff : 0;
    } catch { return 0; }
  }, [form.date, form.start, form.end]);

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const defaultDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  const [submitMonth, setSubmitMonth] = React.useState(defaultMonth);
  const [submitDate, setSubmitDate] = React.useState(defaultDate);
  const [submittingDay, setSubmittingDay] = React.useState(false);
  const [submittingMonth, setSubmittingMonth] = React.useState(false);

  async function submitDay() {
    if (!submitDate) return;
    if (!confirm(`Alle DRAFT/REJECTED-Einträge am ${submitDate} einreichen?`)) return;
    setSubmittingDay(true);
    try {
      const res = await fetch("/api/time-entries/submit-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: submitDate }),
      });
      if (!res.ok) throw new Error(await res.text());
      await reload();
    } catch (e: unknown) {
      alert(errMsg(e) || "Einreichen (Tag) fehlgeschlagen");
    } finally { setSubmittingDay(false); }
  }

  async function submitMonthAction() {
    if (!submitMonth) return;
    if (!confirm(`Alle DRAFT/REJECTED-Einträge für ${submitMonth} einreichen?`)) return;
    setSubmittingMonth(true);
    try {
      const res = await fetch("/api/time-entries/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: submitMonth }),
      });
      if (!res.ok) throw new Error(await res.text());
      await reload();
    } catch (e: unknown) {
      alert(errMsg(e) || "Einreichen (Monat) fehlgeschlagen");
    } finally { setSubmittingMonth(false); }
  }

  function openCreate() { setForm(defaultForm()); setOpen(true); }

  function openEdit(entry: Entry) {
    const status = entry.status ?? "DRAFT";
    if (status === "APPROVED" || status === "SUBMITTED") {
      alert("Dieser Eintrag ist eingereicht/freigegeben und gesperrt.");
      return;
    }
    setForm({
      mode: "edit",
      id: entry.id,
      date: isoToLocalDateInput(entry.startUtc),
      start: isoToLocalTimeInput(entry.startUtc),
      end: isoToLocalTimeInput(entry.endUtc),
      location: entry.location ?? "",
      note: entry.note ?? "",
    });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const payload = {
        workDate: dateOnlyUtcIso(form.date),
        startUtc: toUtcIso(form.date, form.start),
        endUtc: toUtcIso(form.date, form.end),
        location: form.location,
        note: form.note,
      };
      if (form.mode === "create") {
        const res = await fetch("/api/time-entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch(`/api/time-entries/${form.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text());
      }
      setOpen(false);
      await reload();
    } catch (e: unknown) {
      alert(errMsg(e) || "Fehler beim Speichern");
    } finally { setBusy(false); }
  }

  async function handleDelete(id: string, status?: Entry["status"]) {
    if (status === "APPROVED" || status === "SUBMITTED") {
      alert("Eingereichte/freigegebene Einträge sind gesperrt und können nicht gelöscht werden.");
      return;
    }
    if (confirmId !== id) { setConfirmId(id); return; }
    try {
      const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setEntries(prev => prev.filter(x => x.id !== id));
      setConfirmId(null);
    } catch (e: unknown) {
      alert(errMsg(e) || "Löschen fehlgeschlagen");
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-xl font-semibold">Meine Arbeitszeiten</h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tag einreichen */}
          <div className="flex items-center gap-2">
            <label htmlFor="submit-date" className="text-sm">Tag</label>
            <input id="submit-date" type="date" className="border rounded px-3 py-2" value={submitDate} onChange={(e) => setSubmitDate(e.target.value)} />
            <button onClick={submitDay} disabled={submittingDay} className="rounded-2xl px-3 py-2 border shadow">
              {submittingDay ? "Reiche ein…" : "Tag einreichen"}
            </button>
          </div>

          {/* Monat einreichen */}
          <div className="flex items-center gap-2">
            <label htmlFor="submit-month" className="text-sm">Monat</label>
            <input id="submit-month" type="month" className="border rounded px-3 py-2" value={submitMonth} onChange={(e) => setSubmitMonth(e.target.value)} />
            <button onClick={submitMonthAction} disabled={submittingMonth} className="rounded-2xl px-3 py-2 border shadow">
              {submittingMonth ? "Reiche ein…" : "Monat einreichen"}
            </button>
          </div>

          <button onClick={openCreate} className="rounded-2xl px-3 py-2 border shadow" aria-label="Neuer Eintrag">
            Neuer Eintrag
          </button>
        </div>
      </div>

      {loading && <p>Daten werden geladen…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && entries.length === 0 && (
        <p className="text-gray-600">Noch keine Einträge. Lege deinen ersten an!</p>
      )}

      {entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Datum</th>
                <th className="py-2 pr-4">Von</th>
                <th className="py-2 pr-4">Bis</th>
                <th className="py-2 pr-4">Dauer</th>
                <th className="py-2 pr-4">Ort</th>
                <th className="py-2 pr-4">Notiz</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const d = new Date(e.startUtc);
                const date = d.toLocaleDateString();
                const start = new Date(e.startUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const end = new Date(e.endUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const status = e.status ?? "DRAFT";
                const locked = status === "SUBMITTED" || status === "APPROVED";

                return (
                  <tr key={e.id} className="border-b align-top">
                    <td className="py-2 pr-4 whitespace-nowrap">{date}</td>
                    <td className="py-2 pr-4">{start}</td>
                    <td className="py-2 pr-4">{end}</td>
                    <td className="py-2 pr-4">{minutesToHHMM(e.durationMin)}</td>
                    <td className="py-2 pr-4 max-w-[12rem] truncate" title={e.location ?? ""}>{e.location}</td>
                    <td className="py-2 pr-4 max-w-[16rem] truncate" title={e.note ?? ""}>{e.note}</td>
                    <td className="py-2 pr-4">
                      <span className={
                        "inline-block rounded-full px-2 py-0.5 text-xs " +
                        (status === "APPROVED" ? "bg-green-100 text-green-800" :
                         status === "SUBMITTED" ? "bg-yellow-100 text-yellow-800" :
                         status === "REJECTED" ? "bg-red-100 text-red-800" :
                         "bg-gray-100 text-gray-800")
                      }>
                        {status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 space-x-2 whitespace-nowrap">
                      <button className="underline disabled:text-gray-400" onClick={() => openEdit(e)} disabled={locked}
                              title={locked ? "Eingereicht/freigegeben – gesperrt" : undefined}>
                        Bearbeiten
                      </button>
                      {confirmId === e.id ? (
                        <>
                          <button className="text-red-600 underline disabled:text-gray-400"
                                  onClick={() => handleDelete(e.id, status)} disabled={locked}
                                  title={locked ? "Eingereicht/freigegeben – gesperrt" : undefined}>
                            Löschen bestätigen
                          </button>
                          <button className="underline" onClick={() => setConfirmId(null)}>Abbrechen</button>
                        </>
                      ) : (
                        <button className="text-red-600 underline disabled:text-gray-400"
                                onClick={() => setConfirmId(e.id)} disabled={locked}
                                title={locked ? "Eingereicht/freigegeben – gesperrt" : undefined}>
                          Löschen
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleSave} className="w-full max-w-md space-y-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow">
            <h3 className="text-lg font-semibold">{form.mode === "create" ? "Neuer Eintrag" : "Eintrag bearbeiten"}</h3>
            <div>
              <label htmlFor="date" className="block text-sm">Datum</label>
              <input id="date" type="date" className="w-full border rounded px-3 py-2" value={form.date} onChange={(e)=>setForm({...form, date: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="start" className="block text-sm">Von</label>
                <input id="start" type="time" className="w-full border rounded px-3 py-2" value={form.start} onChange={(e)=>setForm({...form, start: e.target.value})} required />
              </div>
              <div>
                <label htmlFor="end" className="block text-sm">Bis</label>
                <input id="end" type="time" className="w-full border rounded px-3 py-2" value={form.end} onChange={(e)=>setForm({...form, end: e.target.value})} required />
              </div>
            </div>
            <p className="text-sm">Dauer: <b>{minutesToHHMM(durationMin)}</b></p>
            <div>
              <label htmlFor="location" className="block text-sm">Ort</label>
              <input id="location" className="w-full border rounded px-3 py-2" value={form.location} onChange={(e)=>setForm({...form, location: e.target.value})} placeholder="z. B. Büro Berlin" />
            </div>
            <div>
              <label htmlFor="note" className="block text-sm">Notiz</label>
              <textarea id="note" className="w-full border rounded px-3 py-2" value={form.note} onChange={(e)=>setForm({...form, note: e.target.value})} rows={3} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" className="rounded-2xl px-4 py-2 border" onClick={()=>setOpen(false)}>Abbrechen</button>
              <button type="submit" disabled={busy} className="rounded-2xl px-4 py-2 border shadow">
                {busy ? "Speichere…" : "Speichern"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
