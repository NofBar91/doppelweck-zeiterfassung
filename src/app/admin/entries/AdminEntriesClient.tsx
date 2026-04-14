"use client";
import React from "react";
import {
  minutesToHHMM,
  isoToLocalDateInput,
  isoToLocalTimeInput,
} from "@/lib/timezone";
import { toCSV } from "@/lib/csv";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

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

function sumMinutes(rows: Entry[]) {
  return rows.reduce((a, b) => a + (b.durationMin || 0), 0);
}

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Unbekannter Fehler";
}

export default function AdminEntriesClient() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [usersError, setUsersError] = React.useState<string | null>(null);

  const [filters, setFilters] = React.useState<{
    userId?: string;
    from?: string;
    to?: string;
    location?: string;
    status?: string;
  }>({});

  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [edit, setEdit] = React.useState<{
    date: string;
    start: string;
    end: string;
    location: string;
    note: string;
  } | null>(null);

  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setLoadingUsers(true);
        setUsersError(null);
        const res = await fetch("/api/users", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        setUsers(await res.json());
      } catch (e: unknown) {
        setUsersError(errMsg(e));
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const load = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (filters.userId) sp.set("userId", filters.userId);
      if (filters.from)
        sp.set("from", new Date(`${filters.from}T00:00:00`).toISOString());
      if (filters.to)
        sp.set("to", new Date(`${filters.to}T23:59:59`).toISOString());
      if (filters.location) sp.set("location", filters.location);
      if (filters.status) sp.set("status", filters.status);

      const res = await fetch(`/api/time-entries?admin=1&${sp.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      setEntries(await res.json());
    } catch (e: unknown) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    void load();
  }, [load]);

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
        body: JSON.stringify({
          startUtc: start,
          endUtc: end,
          workDate,
          location: edit.location,
          note: edit.note,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      setEditingId(null);
      setEdit(null);
      await load();
    } catch (e: unknown) {
      alert(errMsg(e) || "Speichern fehlgeschlagen");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEdit(null);
  }

  async function handleDelete(id: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    try {
      const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setConfirmId(null);
      await load();
    } catch (e: unknown) {
      alert(errMsg(e) || "Löschen fehlgeschlagen");
    }
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
    } catch (e: unknown) {
      alert(errMsg(e) || "Status-Änderung fehlgeschlagen");
    }
  }

  const total = minutesToHHMM(sumMinutes(entries));

  function downloadTextFile(filename: string, text: string) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const headers = [
      "Datum",
      "Mitarbeiter",
      "Von",
      "Bis",
      "Dauer",
      "Ort",
      "Kilometer",
      "Status",
      "Admin*",
    ];

    const rows = entries.map((e) => {
      const date = new Date(e.startUtc).toLocaleDateString();
      const start = new Date(e.startUtc).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const end = new Date(e.endUtc).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const duration = minutesToHHMM(e.durationMin);
      const user = e.user?.name ?? e.user?.email ?? e.userId;
      const status = (e as Partial<Entry>).status ?? "DRAFT";
      return [
        date,
        user,
        start,
        end,
        duration,
        e.location ?? "",
        e.note ?? "",
        status,
        e.editedByAdmin ? "*" : "",
      ];
    });

    const totalMin = sumMinutes(entries);
    const totalStr = minutesToHHMM(totalMin);

    const noteSum = entries.reduce((sum, e) => {
      const note = String(e.note ?? "").replace(",", ".");
      const match = note.match(/-?\d+(\.\d+)?/);
      if (match) {
        const val = parseFloat(match[0]);
        if (!isNaN(val)) return sum + val;
      }
      return sum;
    }, 0);

    rows.push([]);
    rows.push(["", "", "", "Gesamt:", totalStr, "", `${noteSum} KM`, "", ""]);

    const csv = toCSV(headers, rows);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`arbeitszeiten_${stamp}.csv`, csv);
  }

  return (
    <div className="space-y-5">
      {/* Filter */}
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Filter</h2>
            <p className="text-sm text-zinc-400">
              Mitarbeiter, Zeitraum, Ort und Status eingrenzen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <FormField label="Mitarbeiter" htmlFor="filter-user">
            <select
              id="filter-user"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
              value={filters.userId || ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  userId: e.target.value || undefined,
                }))
              }
              disabled={loadingUsers}
            >
              <option value="">Alle</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Von" htmlFor="filter-from">
            <input
              id="filter-from"
              type="date"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
              value={filters.from || ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  from: e.target.value || undefined,
                }))
              }
            />
          </FormField>

          <FormField label="Bis" htmlFor="filter-to">
            <input
              id="filter-to"
              type="date"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
              value={filters.to || ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  to: e.target.value || undefined,
                }))
              }
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Ort enthält" htmlFor="filter-location">
              <input
                id="filter-location"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                placeholder="z. B. Büro"
                value={filters.location || ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    location: e.target.value || undefined,
                  }))
                }
              />
            </FormField>
          </div>

          <FormField label="Status" htmlFor="filter-status">
            <select
              id="filter-status"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
              value={filters.status || ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: e.target.value || undefined,
                }))
              }
            >
              <option value="">Alle</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </FormField>
        </div>

        {usersError && (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            Mitarbeiter konnten nicht geladen werden: {usersError}
          </div>
        )}
      </section>

      {/* Toolbar */}
      <section className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="text-sm text-zinc-300">
          Summe: <span className="font-semibold text-white">{total} h</span>{" "}
          <span className="text-zinc-500">({entries.length} Einträge)</span>
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            onClick={() => load()}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Aktualisieren
          </button>
          <button
            onClick={() => setFilters({})}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Zurücksetzen
          </button>
          <button
            onClick={exportCsv}
            className="rounded-2xl bg-gradient-to-r from-amber-200/90 via-orange-200/90 to-amber-100/90 px-4 py-3 text-sm font-semibold text-zinc-900 shadow-[0_10px_30px_rgba(217,119,6,0.18)] transition hover:scale-[1.02]"
          >
            CSV Export
          </button>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-zinc-300">
          Daten werden geladen…
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Mobile Cards */}
      {!loading && entries.length > 0 && (
        <div className="grid gap-3 xl:hidden">
          {entries.map((e) => {
            const date = new Date(e.startUtc).toLocaleDateString();
            const start = isoToLocalTimeInput(e.startUtc);
            const end = isoToLocalTimeInput(e.endUtc);
            const duration = minutesToHHMM(e.durationMin);
            const isEditing = editingId === e.id;
            const editable = e.status !== "APPROVED";

            return (
              <article
                key={e.id}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{date}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {e.user?.name ?? e.user?.email ?? e.userId}
                    </p>
                  </div>
                  <StatusBadge status={e.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <InfoPair label="Von" value={start} />
                  <InfoPair label="Bis" value={end} />
                  <InfoPair label="Dauer" value={duration} />
                  <InfoPair
                    label="Admin"
                    value={e.editedByAdmin ? "✱ bearbeitet" : "—"}
                  />
                  <InfoPair
                    label="Ort"
                    value={e.location || "—"}
                    className="col-span-2"
                  />
                  <InfoPair
                    label="Kilometer"
                    value={e.note || "—"}
                    className="col-span-2"
                  />
                </div>

                {isEditing && edit ? (
                  <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField label="Von" htmlFor={`start-${e.id}`}>
                        <input
                          id={`start-${e.id}`}
                          type="time"
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                          value={edit.start}
                          onChange={(ev) =>
                            setEdit((s) =>
                              s ? { ...s, start: ev.target.value } : s
                            )
                          }
                        />
                      </FormField>

                      <FormField label="Bis" htmlFor={`end-${e.id}`}>
                        <input
                          id={`end-${e.id}`}
                          type="time"
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                          value={edit.end}
                          onChange={(ev) =>
                            setEdit((s) =>
                              s ? { ...s, end: ev.target.value } : s
                            )
                          }
                        />
                      </FormField>
                    </div>

                    <FormField label="Ort" htmlFor={`location-${e.id}`}>
                      <input
                        id={`location-${e.id}`}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                        value={edit.location}
                        onChange={(ev) =>
                          setEdit((s) =>
                            s ? { ...s, location: ev.target.value } : s
                          )
                        }
                      />
                    </FormField>

                    <FormField label="Kilometer" htmlFor={`note-${e.id}`}>
                      <input
                        id={`note-${e.id}`}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                        value={edit.note}
                        onChange={(ev) =>
                          setEdit((s) =>
                            s ? { ...s, note: ev.target.value } : s
                          )
                        }
                      />
                    </FormField>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-xl bg-gradient-to-r from-amber-200/90 via-orange-200/90 to-amber-100/90 px-4 py-2 text-sm font-semibold text-zinc-900"
                        onClick={() => saveEdit(e.id)}
                      >
                        Speichern
                      </button>
                      <button
                        className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white"
                        onClick={cancelEdit}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white disabled:opacity-40"
                      onClick={() => startEdit(e)}
                      disabled={!editable}
                      title={
                        !editable
                          ? "Freigegebene Einträge sind gesperrt"
                          : undefined
                      }
                    >
                      Bearbeiten
                    </button>

                    {e.status !== "APPROVED" && (
                      <button
                        className="rounded-xl border border-orange-300/20 bg-orange-300/10 px-3 py-2 text-sm text-orange-200"
                        onClick={() => setStatus(e.id, "APPROVED")}
                      >
                        Freigeben
                      </button>
                    )}

                    {e.status !== "REJECTED" && (
                      <button
                        className="rounded-xl border border-amber-200/20 bg-amber-100/10 px-3 py-2 text-sm text-amber-100"
                        onClick={() => setStatus(e.id, "REJECTED")}
                      >
                        Ablehnen
                      </button>
                    )}

                    {confirmId === e.id ? (
                      <>
                        <button
                          className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200"
                          onClick={() => handleDelete(e.id)}
                        >
                          Löschen bestätigen
                        </button>
                        <button
                          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                          onClick={() => setConfirmId(null)}
                        >
                          Abbrechen
                        </button>
                      </>
                    ) : (
                      <button
                        className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200"
                        onClick={() => setConfirmId(e.id)}
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Desktop Table */}
      {!loading && entries.length > 0 && (
        <div className="hidden overflow-x-auto xl:block">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-400">
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Mitarbeiter</th>
                  <th className="px-4 py-3">Von</th>
                  <th className="px-4 py-3">Bis</th>
                  <th className="px-4 py-3">Dauer</th>
                  <th className="px-4 py-3">Ort</th>
                  <th className="px-4 py-3">Kilometer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const date = new Date(e.startUtc).toLocaleDateString();
                  const start = isoToLocalTimeInput(e.startUtc);
                  const end = isoToLocalTimeInput(e.endUtc);
                  const duration = minutesToHHMM(e.durationMin);
                  const isEditing = editingId === e.id;
                  const editable = e.status !== "APPROVED";

                  return (
                    <tr
                      key={e.id}
                      className="border-b border-white/10 align-top last:border-b-0"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">{date}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {e.user?.name ?? e.user?.email ?? e.userId}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            aria-label="Von"
                            type="time"
                            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                            value={edit?.start || start}
                            onChange={(ev) =>
                              setEdit((s) =>
                                s ? { ...s, start: ev.target.value } : s
                              )
                            }
                          />
                        ) : (
                          start
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            aria-label="Bis"
                            type="time"
                            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                            value={edit?.end || end}
                            onChange={(ev) =>
                              setEdit((s) =>
                                s ? { ...s, end: ev.target.value } : s
                              )
                            }
                          />
                        ) : (
                          end
                        )}
                      </td>
                      <td className="px-4 py-3">{duration}</td>
                      <td className="max-w-[12rem] px-4 py-3">
                        {isEditing ? (
                          <input
                            aria-label="Ort"
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                            value={edit?.location || ""}
                            onChange={(ev) =>
                              setEdit((s) =>
                                s ? { ...s, location: ev.target.value } : s
                              )
                            }
                          />
                        ) : (
                          <span
                            title={e.location ?? ""}
                            className="inline-block max-w-[12rem] truncate"
                          >
                            {e.location || "—"}
                          </span>
                        )}
                      </td>
                      <td className="max-w-[16rem] px-4 py-3">
                        {isEditing ? (
                          <input
                            aria-label="Kilometer"
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                            value={edit?.note || ""}
                            onChange={(ev) =>
                              setEdit((s) =>
                                s ? { ...s, note: ev.target.value } : s
                              )
                            }
                          />
                        ) : (
                          <span
                            title={e.note ?? ""}
                            className="inline-block max-w-[16rem] truncate"
                          >
                            {e.note || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="px-4 py-3">
                        {e.editedByAdmin ? "✱" : ""}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-xl bg-gradient-to-r from-amber-200/90 via-orange-200/90 to-amber-100/90 px-3 py-2 text-sm font-semibold text-zinc-900"
                              onClick={() => saveEdit(e.id)}
                            >
                              Speichern
                            </button>
                            <button
                              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                              onClick={cancelEdit}
                            >
                              Abbrechen
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white disabled:opacity-40"
                              onClick={() => startEdit(e)}
                              disabled={!editable}
                              title={
                                !editable
                                  ? "Freigegebene Einträge sind gesperrt"
                                  : undefined
                              }
                            >
                              Bearbeiten
                            </button>

                            {e.status !== "APPROVED" && (
                              <button
                                className="rounded-xl border border-orange-300/20 bg-orange-300/10 px-3 py-2 text-sm text-orange-200"
                                onClick={() => setStatus(e.id, "APPROVED")}
                              >
                                Freigeben
                              </button>
                            )}

                            {e.status !== "REJECTED" && (
                              <button
                                className="rounded-xl border border-amber-200/20 bg-amber-100/10 px-3 py-2 text-sm text-amber-100"
                                onClick={() => setStatus(e.id, "REJECTED")}
                              >
                                Ablehnen
                              </button>
                            )}

                            {confirmId === e.id ? (
                              <>
                                <button
                                  className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200"
                                  onClick={() => handleDelete(e.id)}
                                >
                                  Bestätigen
                                </button>
                                <button
                                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                                  onClick={() => setConfirmId(null)}
                                >
                                  Abbrechen
                                </button>
                              </>
                            ) : (
                              <button
                                className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200"
                                onClick={() => setConfirmId(e.id)}
                              >
                                Löschen
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-sm text-zinc-400">
          Keine Einträge für die aktuellen Filter.
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
}) {
  const map = {
    DRAFT: "border-white/10 bg-white/5 text-zinc-300",
    SUBMITTED: "border-amber-200/20 bg-amber-100/10 text-amber-100",
    APPROVED: "border-orange-300/20 bg-orange-300/10 text-orange-200",
    REJECTED: "border-red-400/20 bg-red-400/10 text-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
}

function InfoPair({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-zinc-200">{value}</p>
    </div>
  );
}
