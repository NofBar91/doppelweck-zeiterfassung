"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import { statusLabels } from "@/lib/status";
import {
  minutesToHHMM,
  toUtcIso,
  dateOnlyUtcIso,
  isoToLocalDateInput,
  isoToLocalTimeInput,
} from "@/lib/timezone";
import { getThemeClasses } from "@/lib/theme-classes";
import { cn } from "@/lib/cn";

type Status = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

type UserLite = { id: string; name: string | null; email: string | null };

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
  status?: Status;
  user?: UserLite;
};

function useEntries() {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/time-entries", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Entry[];
      setEntries(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

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

  return {
    mode: "create",
    date: `${yyyy}-${mm}-${dd}`,
    start: "04:00",
    end: "09:00",
    location: "",
    note: "",
  };
}

export default function TimeEntriesClient() {
  const theme = getThemeClasses();
  const { entries, setEntries, loading, error, reload } = useEntries();

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(defaultForm());
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [filterMonth, setFilterMonth] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const durationMin = React.useMemo(() => {
    try {
      const s = new Date(`${form.date}T${form.start}:00`);
      const e = new Date(`${form.date}T${form.end}:00`);
      const diff = Math.round((+e - +s) / 60000);
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  }, [form.date, form.start, form.end]);

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const [submitMonth, setSubmitMonth] = React.useState<string>(defaultMonth);
  const [submitting, setSubmitting] = React.useState(false);

  async function submitCurrentMonth() {
    if (!confirm(`Alle Entwürfe und zurückgegebenen Einträge für ${submitMonth} einreichen? Danach sind sie zur Prüfung gesperrt.`))
      return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/time-entries/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: submitMonth }),
      });
      if (!res.ok) throw new Error(await res.text());
      await reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Einreichen fehlgeschlagen");
    } finally {
      setSubmitting(false);
    }
  }

  const [submitDay, setSubmitDay] = React.useState<string>(defaultForm().date);
  const [submittingDay, setSubmittingDay] = React.useState(false);

  async function submitSingleDay() {
    if (!confirm(`Alle Entwürfe und zurückgegebenen Einträge am ${submitDay} einreichen? Danach sind sie zur Prüfung gesperrt.`))
      return;

    setSubmittingDay(true);
    try {
      const res = await fetch("/api/time-entries/submit-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: submitDay }),
      });
      if (!res.ok) throw new Error(await res.text());
      await reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Einreichen fehlgeschlagen");
    } finally {
      setSubmittingDay(false);
    }
  }

  function openCreate() {
    setFormError(null);
    setForm(defaultForm());
    setOpen(true);
  }

  function openEdit(entry: Entry) {
    setFormError(null);
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

  async function handleSave(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError(null);

    try {
      if (durationMin <= 0) throw new Error("Das Ende muss nach dem Beginn liegen.");
      const payload = {
        workDate: dateOnlyUtcIso(form.date),
        startUtc: toUtcIso(form.date, form.start),
        endUtc: toUtcIso(form.date, form.end),
        location: form.location,
        note: form.note,
      };

      if (form.mode === "create") {
        const res = await fetch("/api/time-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch(`/api/time-entries/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
      }

      setOpen(false);
      setNotice("Deine Arbeitszeit wurde gespeichert.");
      await reload();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Fehler beim Speichern");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }

    try {
      const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setEntries((prev) => prev.filter((x) => x.id !== id));
      setConfirmId(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Löschen fehlgeschlagen");
    }
  }

  const monthEntries = entries.filter(e => isoToLocalDateInput(e.startUtc).startsWith(defaultMonth));
  const visibleEntries = entries.filter(e =>
    (!filterMonth || isoToLocalDateInput(e.startUtc).startsWith(filterMonth)) &&
    (!query || `${e.location || ""} ${e.note || ""}`.toLocaleLowerCase("de-DE").includes(query.toLocaleLowerCase("de-DE")))
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="dw-stat"><p className="dw-kicker">Stunden · dieser Monat</p><strong>{loading ? "—" : minutesToHHMM(monthEntries.reduce((sum, e) => sum + e.durationMin, 0))}<span className="ml-2 text-sm tracking-normal text-stone-500">h</span></strong></div>
        <div className="dw-stat"><p className="dw-kicker">Touren · dieser Monat</p><strong>{loading ? "—" : monthEntries.length}</strong></div>
        <div className="dw-stat"><p className="dw-kicker">Noch einzureichen</p><strong>{loading ? "—" : entries.filter(e => !e.status || e.status === "DRAFT" || e.status === "REJECTED").length}</strong></div>
        <div className="dw-stat"><p className="dw-kicker">Freigegeben · Monat</p><strong>{loading ? "—" : minutesToHHMM(monthEntries.filter(e => e.status === "APPROVED").reduce((sum, e) => sum + e.durationMin, 0))}<span className="ml-2 text-sm tracking-normal text-stone-500">h</span></strong></div>
      </div>
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}
      <div>
        <section
          className={cn(
            "overflow-hidden rounded-2xl",
            theme.surface.softCard
          )}
        >
          <div className="relative">
            <div
              className={cn(
                "pointer-events-none absolute inset-0",
                theme.surface.overlay
              )}
            />

            <div className="relative p-5 sm:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                      theme.badge.base
                    )}
                  >
                    {theme.labels.timeEntries}
                  </span>

                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
                    Deine Zeiteinträge
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
                    Erfasse deine Tour. Prüfe deine Zeiten und reiche sie zur Freigabe ein.
                  </p>
                </div>

                <button
                  onClick={openCreate}
                  className={cn(
                    "inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold transition hover:brightness-95",
                    theme.button.primary
                  )}
                  aria-label="Neuer Eintrag"
                >
                  + Neuer Eintrag
                </button>
              </div>

              {entries.some(e => !e.status || e.status === "DRAFT" || e.status === "REJECTED") && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <ActionPanel
                    title="Monat einreichen"
                    description="Entwürfe und zurückgegebene Zeiten eines Monats zur Prüfung absenden."
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label htmlFor="submit-month" className="mb-2 block text-sm font-medium text-stone-600">
                          Monat
                        </label>
                        <input
                          id="submit-month"
                          type="month"
                          value={submitMonth}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSubmitMonth(e.target.value)
                          }
                          className={cn(
                            "w-full rounded-2xl px-4 py-3",
                            theme.input.base,
                            theme.input.focus
                          )}
                        />
                      </div>
                      <button
                        onClick={submitCurrentMonth}
                        disabled={submitting}
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60",
                          theme.button.secondary
                        )}
                      >
                        {submitting ? "Reiche ein…" : "Monat einreichen"}
                      </button>
                    </div>
                  </ActionPanel>

                  <ActionPanel
                    title="Tag einreichen"
                    description="Alle offenen Einträge für ein bestimmtes Datum gesammelt absenden."
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label htmlFor="submit-day" className="mb-2 block text-sm font-medium text-stone-600">
                          Datum
                        </label>
                        <input
                          id="submit-day"
                          type="date"
                          value={submitDay}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSubmitDay(e.target.value)
                          }
                          className={cn(
                            "w-full rounded-2xl px-4 py-3",
                            theme.input.base,
                            theme.input.focus
                          )}
                        />
                      </div>
                      <button
                        onClick={submitSingleDay}
                        disabled={submittingDay}
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60",
                          theme.button.secondary
                        )}
                      >
                        {submittingDay ? "Reiche ein…" : "Tag einreichen"}
                      </button>
                    </div>
                  </ActionPanel>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 rounded-xl bg-stone-50 p-3 sm:flex-row sm:items-end">
                <div className="flex-1"><label htmlFor="search-tour" className="dw-field">Tour suchen</label><input id="search-tour" type="search" className="dw-input w-full rounded-xl px-3 py-2" placeholder="Ort oder Kilometer durchsuchen" value={query} onChange={e=>setQuery(e.target.value)} /></div>
                <div><label htmlFor="filter-month" className="dw-field">Zeitraum</label><input id="filter-month" type="month" className="dw-input w-full rounded-xl px-3 py-2" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} /></div>
                {(filterMonth || query) && <button onClick={()=>{setFilterMonth(""); setQuery("");}} className="dw-secondary rounded-xl px-3 py-2 text-sm">Zurücksetzen</button>}
              </div>
              {loading && (
                <div
                  className={cn(
                    "mt-6 rounded-2xl px-4 py-4 text-sm text-stone-600",
                    theme.surface.softCard
                  )}
                >
                  Daten werden geladen…
                </div>
              )}

              {error && (
                <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm text-red-800">
                  {error}
                </div>
              )}

              {!loading && !error && visibleEntries.length === 0 && (
                <div
                  className={cn(
                    "mt-6 rounded-2xl px-4 py-5 text-sm text-stone-600",
                    theme.surface.softCard
                  )}
                >
                  <div className="dw-empty"><Icon name="truck" width="32" height="32"/><p className="font-semibold text-stone-800">{entries.length ? "Keine passenden Touren" : "Bereit für deine erste Tour?"}</p><p>{entries.length ? "Ändere den Zeitraum oder deinen Suchbegriff." : "Mit „Neuer Eintrag“ erfasst du Beginn, Ende und Kilometer."}</p></div>
                </div>
              )}

              {!loading && visibleEntries.length > 0 && (
                <>
                  <div className="mt-6 grid gap-3 md:hidden">
                    {visibleEntries.map((e) => {
                      const date = new Date(e.startUtc).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
                      const start = new Date(e.startUtc).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const end = new Date(e.endUtc).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const status: Status = e.status ?? "DRAFT";
                      const locked =
                        status === "SUBMITTED" || status === "APPROVED";

                      return (
                        <article
                          key={e.id}
                          className={cn("rounded-2xl p-4", theme.surface.softCard)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-stone-900">
                                {date}
                              </p>
                              <p className="mt-1 text-xs text-stone-600">
                                {start} – {end}
                              </p>
                            </div>
                            <StatusBadge status={status} />
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <InfoPair
                              label="Dauer"
                              value={minutesToHHMM(e.durationMin)}
                            />
                            <InfoPair label="Ort" value={e.location || "—"} />
                            <InfoPair
                              label="Kilometer"
                              value={e.note || "—"}
                              className="col-span-2"
                            />
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              className={cn(
                                "rounded-xl px-3 py-2 text-sm disabled:opacity-40",
                                theme.button.secondary
                              )}
                              onClick={() => openEdit(e)}
                              disabled={locked}
                            >
                              Bearbeiten
                            </button>

                            {locked ? (
                              <span className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
                                gesperrt
                              </span>
                            ) : confirmId === e.id ? (
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
                        </article>
                      );
                    })}
                  </div>

                  <div className="mt-6 hidden overflow-x-auto md:block">
                    <div className={cn("rounded-2xl", theme.surface.softCard)}>
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-stone-200 text-left text-stone-600">
                            <th className="px-4 py-3">Datum</th>
                            <th className="px-4 py-3">Von</th>
                            <th className="px-4 py-3">Bis</th>
                            <th className="px-4 py-3">Dauer</th>
                            <th className="px-4 py-3">Ort</th>
                            <th className="px-4 py-3">Kilometer</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Aktionen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleEntries.map((e) => {
                            const date = new Date(e.startUtc).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
                            const start = new Date(e.startUtc).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            );
                            const end = new Date(e.endUtc).toLocaleTimeString("de-DE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            const status: Status = e.status ?? "DRAFT";
                            const locked =
                              status === "SUBMITTED" || status === "APPROVED";

                            return (
                              <tr
                                key={e.id}
                                className="border-b border-stone-200 align-top last:border-b-0"
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {date}
                                </td>
                                <td className="px-4 py-3">{start}</td>
                                <td className="px-4 py-3">{end}</td>
                                <td className="px-4 py-3">
                                  {minutesToHHMM(e.durationMin)}
                                </td>
                                <td
                                  className="max-w-[12rem] truncate px-4 py-3"
                                  title={e.location ?? ""}
                                >
                                  {e.location || "—"}
                                </td>
                                <td
                                  className="max-w-[16rem] truncate px-4 py-3"
                                  title={e.note ?? ""}
                                >
                                  {e.note || "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <StatusBadge status={status} />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      className={cn(
                                        "rounded-xl px-3 py-2 text-sm disabled:opacity-40",
                                        theme.button.secondary
                                      )}
                                      onClick={() => openEdit(e)}
                                      disabled={locked}
                                    >
                                      Bearbeiten
                                    </button>

                                    {locked ? (
                                      <span className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
                                        gesperrt
                                      </span>
                                    ) : confirmId === e.id ? (
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
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)} busy={busy} labelledBy="entry-title">
          <form
            onSubmit={handleSave}
            className={cn(
              "flex max-h-[92svh] w-full flex-col overflow-hidden rounded-2xl border shadow-2xl sm:max-w-xl sm:rounded-2xl",
              theme.surface.modal
            )}
          >
            <div className="relative border-b border-stone-200 px-5 py-4 sm:px-6">
              <div
                className={cn(
                  "pointer-events-none absolute inset-0",
                  theme.surface.overlay
                )}
              />
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-900">
                  Zeiteintrag
                </p>
                <h3 id="entry-title" className="mt-2 text-xl font-bold text-stone-900">
                  {form.mode === "create"
                    ? "Neuen Eintrag anlegen"
                    : "Eintrag bearbeiten"}
                </h3>
                <p className="mt-1 text-sm text-stone-600">
                  Trage die tatsächlichen Zeiten deiner Tour ein.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {formError && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{formError}</p>}
              <div className="space-y-4">
                <FormField label="Datum" htmlFor="date">
                  <input
                    id="date"
                    type="date"
                    className={cn(
                      "w-full rounded-2xl px-4 py-3",
                      theme.input.base,
                      theme.input.focus
                    )}
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    required
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Von" htmlFor="start">
                    <input
                      id="start"
                      type="time"
                      className={cn(
                        "w-full rounded-2xl px-4 py-3",
                        theme.input.base,
                        theme.input.focus
                      )}
                      value={form.start}
                      onChange={(e) =>
                        setForm({ ...form, start: e.target.value })
                      }
                      required
                    />
                  </FormField>

                  <FormField label="Bis" htmlFor="end">
                    <input
                      id="end"
                      type="time"
                      className={cn(
                        "w-full rounded-2xl px-4 py-3",
                        theme.input.base,
                        theme.input.focus
                      )}
                      value={form.end}
                      onChange={(e) =>
                        setForm({ ...form, end: e.target.value })
                      }
                      required
                    />
                  </FormField>
                </div>

                <div
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm",
                    theme.button.warning
                  )}
                >
                  Dauer:{" "}
                  <span className="font-semibold">
                    {minutesToHHMM(durationMin)}
                  </span>
                </div>

                <FormField label="Ort" htmlFor="location">
                  <input
                    id="location"
                    className={cn(
                      "w-full rounded-2xl px-4 py-3",
                      theme.input.base,
                      theme.input.focus
                    )}
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="z. B. Filiale oder Tour"
                  />
                </FormField>

                <FormField label="Kilometer" htmlFor="note">
                  <textarea
                    id="note"
                    className={cn(
                      "w-full rounded-2xl px-4 py-3",
                      theme.input.base,
                      theme.input.focus
                    )}
                    value={form.note}
                    onChange={(e) =>
                      setForm({ ...form, note: e.target.value })
                    }
                    rows={2}
                    placeholder="z. B. gefahrene Kilometer"
                  />
                </FormField>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-stone-200 bg-stone-50 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl px-4 py-3 transition",
                    theme.button.secondary
                  )}
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={busy || durationMin <= 0}
                  className={cn(
                    "rounded-2xl px-5 py-3 font-semibold transition hover:brightness-95 disabled:opacity-70",
                    theme.button.primary
                  )}
                >
                  {busy ? "Speichere…" : "Speichern"}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ActionPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const theme = getThemeClasses();

  return (
    <div className={cn("rounded-2xl p-4", theme.surface.softCard)}>
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const theme = getThemeClasses();

  const map: Record<Status, string> = {
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
