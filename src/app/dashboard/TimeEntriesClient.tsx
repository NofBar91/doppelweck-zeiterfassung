"use client";
import React from "react";
import {
  minutesToHHMM,
  toUtcIso,
  dateOnlyUtcIso,
  isoToLocalDateInput,
  isoToLocalTimeInput,
} from "@/lib/timezone";

type Role = "ADMIN" | "EMPLOYEE";
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
    if (!confirm(`Alle DRAFT/REJECTED-Einträge für ${submitMonth} einreichen?`))
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
    if (!confirm(`Alle DRAFT/REJECTED-Einträge am ${submitDay} einreichen?`))
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
    setForm(defaultForm());
    setOpen(true);
  }

  function openEdit(entry: Entry) {
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

    try {
      const payload = {
        workDate: dateOnlyUtcIso(form.date),
        startUtc: toUtcIso(form.date, form.start),
        endUtc: toUtcIso(form.date, form.end),
        location: form.location || undefined,
        note: form.note || undefined,
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
      await reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Fehler beim Speichern");
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

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#14110f] text-zinc-100">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,222,179,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(120,72,32,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.12),transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:34px_34px]" />
      </div>

      <div
        className="relative z-10 mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
          <div className="relative">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-200/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-orange-400/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%,rgba(255,248,240,0.02))]" />

            <div className="relative p-5 sm:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full border border-amber-200/20 bg-amber-100/10 px-3 py-1 text-xs font-medium text-amber-100">
                    Arbeitszeiten
                  </span>
                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    Meine Arbeitszeiten
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                    Erstelle, bearbeite und reiche deine Zeiten in einem klaren,
                    warmen Doppelweck-Stil ein.
                  </p>
                </div>

                <button
                  onClick={openCreate}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-200/90 via-orange-200/90 to-amber-100/90 px-5 py-3 font-semibold text-zinc-900 shadow-[0_10px_40px_rgba(217,119,6,0.20)] transition hover:scale-[1.02]"
                  aria-label="Neuer Eintrag"
                >
                  + Neuer Eintrag
                </button>
              </div>

              {false && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <ActionPanel
                    title="Monat einreichen"
                    description="Alle DRAFT- oder REJECTED-Einträge für einen Monat gesammelt absenden."
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label className="mb-2 block text-sm font-medium text-zinc-300">
                          Monat
                        </label>
                        <input
                          type="month"
                          value={submitMonth}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSubmitMonth(e.target.value)
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                        />
                      </div>
                      <button
                        onClick={submitCurrentMonth}
                        disabled={submitting}
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-60"
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
                        <label className="mb-2 block text-sm font-medium text-zinc-300">
                          Datum
                        </label>
                        <input
                          type="date"
                          value={submitDay}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSubmitDay(e.target.value)
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                        />
                      </div>
                      <button
                        onClick={submitSingleDay}
                        disabled={submittingDay}
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-60"
                      >
                        {submittingDay ? "Reiche ein…" : "Tag einreichen"}
                      </button>
                    </div>
                  </ActionPanel>
                </div>
              )}

              {loading && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-zinc-300">
                  Daten werden geladen…
                </div>
              )}

              {error && (
                <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm text-red-200">
                  {error}
                </div>
              )}

              {!loading && entries.length === 0 && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-sm text-zinc-400">
                  Noch keine Einträge. Lege deinen ersten an.
                </div>
              )}

              {!loading && entries.length > 0 && (
                <>
                  <div className="mt-6 grid gap-3 md:hidden">
                    {entries.map((e) => {
                      const date = new Date(e.startUtc).toLocaleDateString();
                      const start = new Date(e.startUtc).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const end = new Date(e.endUtc).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const status: Status = e.status ?? "DRAFT";
                      const locked =
                        status === "SUBMITTED" || status === "APPROVED";

                      return (
                        <article
                          key={e.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {date}
                              </p>
                              <p className="mt-1 text-xs text-zinc-400">
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
                              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white disabled:opacity-40"
                              onClick={() => openEdit(e)}
                              disabled={locked}
                            >
                              Bearbeiten
                            </button>

                            {locked ? (
                              <span className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400">
                                gesperrt
                              </span>
                            ) : confirmId === e.id ? (
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
                        </article>
                      );
                    })}
                  </div>

                  <div className="mt-6 hidden overflow-x-auto md:block">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-left text-zinc-400">
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
                          {entries.map((e) => {
                            const date = new Date(
                              e.startUtc
                            ).toLocaleDateString();
                            const start = new Date(
                              e.startUtc
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            const end = new Date(e.endUtc).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            );
                            const status: Status = e.status ?? "DRAFT";
                            const locked =
                              status === "SUBMITTED" || status === "APPROVED";

                            return (
                              <tr
                                key={e.id}
                                className="border-b border-white/10 align-top last:border-b-0"
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
                                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white disabled:opacity-40"
                                      onClick={() => openEdit(e)}
                                      disabled={locked}
                                    >
                                      Bearbeiten
                                    </button>

                                    {locked ? (
                                      <span className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400">
                                        gesperrt
                                      </span>
                                    ) : confirmId === e.id ? (
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
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-6 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSave}
            className="flex max-h-[92svh] w-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#181310] shadow-2xl sm:max-w-xl"
          >
            <div className="relative border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_45%,rgba(255,248,240,0.02))]" />
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-100">
                  Zeiteintrag
                </p>
                <h3 className="mt-2 text-xl font-bold text-white">
                  {form.mode === "create"
                    ? "Neuen Eintrag anlegen"
                    : "Eintrag bearbeiten"}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Klar gestaltet und auf Mobile kompakt bedienbar.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="space-y-4">
                <FormField label="Datum" htmlFor="date">
                  <input
                    id="date"
                    type="date"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
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
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
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
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                      value={form.end}
                      onChange={(e) =>
                        setForm({ ...form, end: e.target.value })
                      }
                      required
                    />
                  </FormField>
                </div>

                <div className="rounded-2xl border border-amber-200/15 bg-amber-100/10 px-4 py-3 text-sm text-amber-100">
                  Dauer:{" "}
                  <span className="font-semibold">
                    {minutesToHHMM(durationMin)}
                  </span>
                </div>

                <FormField label="Ort" htmlFor="location">
                  <input
                    id="location"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
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
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10"
                    value={form.note}
                    onChange={(e) =>
                      setForm({ ...form, note: e.target.value })
                    }
                    rows={4}
                    placeholder="z. B. gefahrene Kilometer"
                  />
                </FormField>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-white/10 bg-[#181310]/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-2xl bg-gradient-to-r from-amber-200/90 via-orange-200/90 to-amber-100/90 px-5 py-3 font-semibold text-zinc-900 shadow-[0_10px_40px_rgba(217,119,6,0.20)] transition hover:scale-[1.02] disabled:opacity-70"
                >
                  {busy ? "Speichere…" : "Speichern"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
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
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
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
