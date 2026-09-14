"use client";
import React from "react";
import { statusLabels } from "@/lib/status";
import {
  minutesToHHMM,
  isoToLocalDateInput,
  isoToLocalTimeInput,
} from "@/lib/timezone";
import { toCSV } from "@/lib/csv";
import { getThemeClasses } from "@/lib/theme-classes";
import { cn } from "@/lib/cn";

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
  const theme = getThemeClasses();

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
      const date = new Date(e.startUtc).toLocaleDateString("de-DE");
      const start = new Date(e.startUtc).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const end = new Date(e.endUtc).toLocaleTimeString("de-DE", {
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
      <section className={cn("rounded-2xl p-4 sm:p-5", theme.surface.softCard)}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Filter</h2>
            <p className="text-sm text-stone-600">
              Mitarbeiter, Zeitraum, Ort und Status eingrenzen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <FormField label="Mitarbeiter" htmlFor="filter-user">
            <select
              id="filter-user"
              className={cn(
                "w-full rounded-2xl px-4 py-3",
                theme.input.base,
                theme.input.focus
              )}
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
              className={cn(
                "w-full rounded-2xl px-4 py-3",
                theme.input.base,
                theme.input.focus
              )}
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
              className={cn(
                "w-full rounded-2xl px-4 py-3",
                theme.input.base,
                theme.input.focus
              )}
              value={filters.to || ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  to: e.target.value || undefined,
                }))
              }
            />
          </FormField>

          <div className="lg:col-span-2">
            <FormField label="Ort enthält" htmlFor="filter-location">
              <input
                id="filter-location"
                className={cn(
                  "w-full rounded-2xl px-4 py-3",
                  theme.input.base,
                  theme.input.focus
                )}
                placeholder="z. B. Beckingen"
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
              className={cn(
                "w-full rounded-2xl px-4 py-3",
                theme.input.base,
                theme.input.focus
              )}
              value={filters.status || ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: e.target.value || undefined,
                }))
              }
            >
              <option value="">Alle</option>
              <option value="DRAFT">Entwurf</option>
              <option value="SUBMITTED">Eingereicht</option>
              <option value="APPROVED">Freigegeben</option>
              <option value="REJECTED">Zurückgegeben</option>
            </select>
          </FormField>
        </div>

        {usersError && (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-800">
            Mitarbeiter konnten nicht geladen werden: {usersError}
          </div>
        )}
      </section>

      {/* Toolbar */}
      <section
        className={cn(
          "flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
          theme.surface.softCard
        )}
      >
        <p className="text-sm text-stone-600">
          Summe: <span className="font-semibold text-stone-900">{total} h</span>{" "}
          <span className="text-stone-500">({entries.length} Einträge)</span>
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            onClick={() => load()}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-medium transition",
              theme.button.secondary
            )}
          >
            Aktualisieren
          </button>
          <button
            onClick={() => setFilters({})}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-medium transition",
              theme.button.secondary
            )}
          >
            Zurücksetzen
          </button>
          <button
            onClick={exportCsv}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-semibold transition hover:brightness-95",
              theme.button.primary
            )}
          >
            Stundenübersicht generieren
          </button>
        </div>
      </section>

      {loading && (
        <div className={cn("rounded-2xl px-4 py-4 text-sm text-stone-600", theme.surface.softCard)}>
          Daten werden geladen…
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Mobile Cards */}
      {!loading && entries.length > 0 && (
        <div className="grid gap-3 xl:hidden">
          {entries.map((e) => {
            const date = new Date(e.startUtc).toLocaleDateString("de-DE");
            const start = isoToLocalTimeInput(e.startUtc);
            const end = isoToLocalTimeInput(e.endUtc);
            const duration = minutesToHHMM(e.durationMin);
            const isEditing = editingId === e.id;
            const editable = e.status !== "APPROVED";

            return (
              <article
                key={e.id}
                className={cn("rounded-2xl p-4", theme.surface.softCard)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{date}</p>
                    <p className="mt-1 text-sm text-stone-600">
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
                  <div className="mt-4 space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField label="Von" htmlFor={`start-${e.id}`}>
                        <input
                          id={`start-${e.id}`}
                          type="time"
                          className={cn(
                            "w-full rounded-xl px-3 py-2",
                            theme.input.base,
                            theme.input.focus
                          )}
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
                          className={cn(
                            "w-full rounded-xl px-3 py-2",
                            theme.input.base,
                            theme.input.focus
                          )}
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
                        className={cn(
                          "w-full rounded-xl px-3 py-2",
                          theme.input.base,
                          theme.input.focus
                        )}
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
                        className={cn(
                          "w-full rounded-xl px-3 py-2",
                          theme.input.base,
                          theme.input.focus
                        )}
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
                        className={cn(
                          "rounded-xl px-4 py-2 text-sm font-semibold",
                          theme.button.primary
                        )}
                        onClick={() => saveEdit(e.id)}
                      >
                        Speichern
                      </button>
                      <button
                        className={cn(
                          "rounded-xl px-4 py-2 text-sm",
                          theme.button.secondary
                        )}
                        onClick={cancelEdit}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm disabled:opacity-40",
                        theme.button.secondary
                      )}
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
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm",
                          theme.button.success
                        )}
                        onClick={() => setStatus(e.id, "APPROVED")}
                      >
                        Freigeben
                      </button>
                    )}

                    {e.status !== "REJECTED" && (
                      <button
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm",
                          theme.button.warning
                        )}
                        onClick={() => setStatus(e.id, "REJECTED")}
                      >
                        Ablehnen
                      </button>
                    )}

                    {confirmId === e.id ? (
                      <>
                        <button
                          className={cn(
                            "rounded-xl px-3 py-2 text-sm",
                            theme.button.danger
                          )}
                          onClick={() => handleDelete(e.id)}
                        >
                          Löschen bestätigen
                        </button>
                        <button
                          className={cn(
                            "rounded-xl px-3 py-2 text-sm",
                            theme.button.secondary
                          )}
                          onClick={() => setConfirmId(null)}
                        >
                          Abbrechen
                        </button>
                      </>
                    ) : (
                      <button
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm",
                          theme.button.danger
                        )}
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
          <div className={cn("rounded-2xl", theme.surface.softCard)}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-stone-600">
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
                  const date = new Date(e.startUtc).toLocaleDateString("de-DE");
                  const start = isoToLocalTimeInput(e.startUtc);
                  const end = isoToLocalTimeInput(e.endUtc);
                  const duration = minutesToHHMM(e.durationMin);
                  const isEditing = editingId === e.id;
                  const editable = e.status !== "APPROVED";

                  return (
                    <tr
                      key={e.id}
                      className="border-b border-stone-200 align-top last:border-b-0"
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
                            className={cn(
                              "rounded-xl px-3 py-2",
                              theme.input.base,
                              theme.input.focus
                            )}
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
                            className={cn(
                              "rounded-xl px-3 py-2",
                              theme.input.base,
                              theme.input.focus
                            )}
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
                            className={cn(
                              "w-full rounded-xl px-3 py-2",
                              theme.input.base,
                              theme.input.focus
                            )}
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
                            className={cn(
                              "w-full rounded-xl px-3 py-2",
                              theme.input.base,
                              theme.input.focus
                            )}
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
                              className={cn(
                                "rounded-xl px-3 py-2 text-sm font-semibold",
                                theme.button.primary
                              )}
                              onClick={() => saveEdit(e.id)}
                            >
                              Speichern
                            </button>
                            <button
                              className={cn(
                                "rounded-xl px-3 py-2 text-sm",
                                theme.button.secondary
                              )}
                              onClick={cancelEdit}
                            >
                              Abbrechen
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              className={cn(
                                "rounded-xl px-3 py-2 text-sm disabled:opacity-40",
                                theme.button.secondary
                              )}
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
                                className={cn(
                                  "rounded-xl px-3 py-2 text-sm",
                                  theme.button.success
                                )}
                                onClick={() => setStatus(e.id, "APPROVED")}
                              >
                                Freigeben
                              </button>
                            )}

                            {e.status !== "REJECTED" && (
                              <button
                                className={cn(
                                  "rounded-xl px-3 py-2 text-sm",
                                  theme.button.warning
                                )}
                                onClick={() => setStatus(e.id, "REJECTED")}
                              >
                                Ablehnen
                              </button>
                            )}

                            {confirmId === e.id ? (
                              <>
                                <button
                                  className={cn(
                                    "rounded-xl px-3 py-2 text-sm",
                                    theme.button.danger
                                  )}
                                  onClick={() => handleDelete(e.id)}
                                >
                                  Bestätigen
                                </button>
                                <button
                                  className={cn(
                                    "rounded-xl px-3 py-2 text-sm",
                                    theme.button.secondary
                                  )}
                                  onClick={() => setConfirmId(null)}
                                >
                                  Abbrechen
                                </button>
                              </>
                            ) : (
                              <button
                                className={cn(
                                  "rounded-xl px-3 py-2 text-sm",
                                  theme.button.danger
                                )}
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
        <div className={cn("rounded-2xl px-4 py-5 text-sm text-stone-600", theme.surface.softCard)}>
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
        className="mb-2 block text-sm font-medium text-stone-600"
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
  const theme = getThemeClasses();

  const map = {
    DRAFT: theme.status.draft,
    SUBMITTED: theme.status.submitted,
    APPROVED: theme.status.approved,
    REJECTED: theme.status.rejected,
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        map[status]
      )}
    >
      {statusLabels[status]}
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
      <p className="text-xs uppercase tracking-[0.15em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-stone-800">{value}</p>
    </div>
  );
}
