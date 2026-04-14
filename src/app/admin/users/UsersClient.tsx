// FILE: src/app/admin/users/UsersClient.tsx
"use client";

import React from "react";
import { toCSV } from "@/lib/csv";
import { getThemeClasses } from "@/lib/theme-classes";
import { cn } from "@/lib/cn";

type Role = "ADMIN" | "EMPLOYEE";
type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
};

type Invite = {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

function download(
  filename: string,
  text: string,
  mime = "text/csv;charset=utf-8"
) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Unbekannter Fehler";
}

export default function UsersClient() {
  const theme = getThemeClasses();

  const [users, setUsers] = React.useState<User[]>([]);
  const [invites, setInvites] = React.useState<Invite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const u = await fetch("/api/admin/users", { cache: "no-store" });
      if (!u.ok) throw new Error(await u.text());
      setUsers(await u.json());

      const i = await fetch("/api/admin/invites", { cache: "no-store" });
      if (!i.ok) throw new Error(await i.text());
      setInvites(await i.json());
    } catch (e: unknown) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  const [directName, setDirectName] = React.useState("");
  const [directEmail, setDirectEmail] = React.useState("");
  const [directPassword, setDirectPassword] = React.useState("");
  const [directRole, setDirectRole] = React.useState<Role>("EMPLOYEE");
  const [busyCreate, setBusyCreate] = React.useState(false);

  async function createDirect(e: React.FormEvent) {
    e.preventDefault();
    if (busyCreate) return;
    setBusyCreate(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: directName || undefined,
          email: directEmail,
          password: directPassword,
          role: directRole,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      setDirectName("");
      setDirectEmail("");
      setDirectPassword("");
      setDirectRole("EMPLOYEE");
      await load();
      alert("Nutzer wurde angelegt.");
    } catch (e: unknown) {
      alert(errMsg(e) || "Anlegen fehlgeschlagen");
    } finally {
      setBusyCreate(false);
    }
  }

  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<Role>("EMPLOYEE");
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [busyInvite, setBusyInvite] = React.useState(false);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    if (busyInvite) return;
    setBusyInvite(true);
    setInviteLink(null);

    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!res.ok) {
        let msg = await res.text();
        try {
          const json = JSON.parse(msg);
          if (json?.error) {
            msg = json.error;
            if (json.details) {
              const issues = Object.entries(json.details.fieldErrors ?? {})
                .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
                .join(" | ");
              if (issues) msg += `\n${issues}`;
            }
          }
        } catch {
          // plain text lassen
        }
        alert(msg || "Einladung fehlgeschlagen");
        return;
      }

      const json = await res.json();
      const token: string | undefined = json?.invite?.token ?? json?.token;
      if (token) {
        const base = process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin;
        const link = `${base}/invite/${token}`;
        setInviteLink(link);
      }

      setInviteEmail("");
      setInviteRole("EMPLOYEE");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Einladung fehlgeschlagen");
    } finally {
      setBusyInvite(false);
    }
  }

  async function revokeInvite(id: string) {
    if (!confirm("Einladung widerrufen?")) return;
    const res = await fetch(`/api/admin/invites/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    await load();
  }

  function copyToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Link kopiert"))
      .catch(() => alert("Kopieren fehlgeschlagen"));
  }

  async function updateRole(id: string, role: Role) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    await load();
  }

  async function deleteUser(id: string) {
    if (
      !confirm("Nutzer wirklich löschen? Alle zugehörigen Zeiten bleiben bestehen.")
    )
      return;
    const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    await load();
  }

  async function sendReset(email: string) {
    await fetch("/api/auth/request-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    alert("Falls die E-Mail existiert, wurde ein Reset-Link erzeugt (E-Mail/Log).");
  }

  function exportUsersCsv() {
    const headers = ["Name", "E-Mail", "Rolle", "Erstellt"];
    const rows = users.map((u) => [
      u.name,
      u.email,
      u.role,
      u.createdAt ? new Date(u.createdAt).toLocaleString() : "",
    ]);
    const csv = toCSV(headers, rows);
    download(`users_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className={cn("rounded-2xl px-4 py-4 text-sm text-zinc-300", theme.surface.softCard)}>
          Daten werden geladen…
        </div>
      )}

      <section className={cn("rounded-[1.5rem] p-4 sm:p-5", theme.surface.softCard)}>
        <h2 className="text-lg font-semibold text-white">
          Mitarbeiter direkt anlegen
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">
          Lege Mitarbeiter direkt mit Passwort und Rolle an.
        </p>

        <form
          onSubmit={createDirect}
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5"
        >
          <div className="md:col-span-2">
            <FormField label="Name" htmlFor="direct-name">
              <input
                id="direct-name"
                className={cn(
                  "w-full rounded-2xl px-4 py-3",
                  theme.input.base,
                  theme.input.focus
                )}
                value={directName}
                onChange={(e) => setDirectName(e.target.value)}
                placeholder="Max Mustermann"
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="E-Mail" htmlFor="direct-email">
              <input
                id="direct-email"
                className={cn(
                  "w-full rounded-2xl px-4 py-3",
                  theme.input.base,
                  theme.input.focus
                )}
                type="email"
                value={directEmail}
                onChange={(e) => setDirectEmail(e.target.value)}
                required
                placeholder="max@firma.de"
              />
            </FormField>
          </div>

          <div>
            <FormField label="Rolle" htmlFor="direct-role">
              <select
                id="direct-role"
                className={cn(
                  "w-full rounded-2xl px-4 py-3",
                  theme.input.base,
                  theme.input.focus
                )}
                value={directRole}
                onChange={(e) => setDirectRole(e.target.value as Role)}
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField
              label="Passwort (min. 8 Zeichen)"
              htmlFor="direct-password"
            >
              <input
                id="direct-password"
                className={cn(
                  "w-full rounded-2xl px-4 py-3",
                  theme.input.base,
                  theme.input.focus
                )}
                type="password"
                value={directPassword}
                onChange={(e) => setDirectPassword(e.target.value)}
                minLength={8}
                required
                placeholder="Sicheres Passwort"
              />
            </FormField>
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              disabled={busyCreate}
              className={cn(
                "w-full rounded-2xl px-4 py-3 font-semibold transition hover:scale-[1.02] disabled:opacity-70 md:w-auto",
                theme.button.primary
              )}
            >
              {busyCreate ? "Lege an…" : "Direkt anlegen"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs leading-5 text-zinc-500">
          Hinweis: Beim direkten Anlegen vergibst du das Passwort. Alternativ
          kannst du unten eine Einladung senden, damit der Mitarbeiter sein
          Passwort selbst setzt.
        </p>
      </section>

      <section className={cn("rounded-[1.5rem] p-4 sm:p-5", theme.surface.softCard)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Nutzer einladen
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Erzeuge einen Einladungslink für neue Mitarbeiter.
            </p>
          </div>

          <button
            type="button"
            onClick={exportUsersCsv}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-medium transition",
              theme.button.secondary
            )}
          >
            Nutzer als CSV
          </button>
        </div>

        <form
          onSubmit={createInvite}
          className="mt-4 flex flex-col gap-3 md:flex-row md:items-end"
        >
          <div className="flex-1">
            <FormField label="E-Mail" htmlFor="invite-email">
              <input
                id="invite-email"
                className={cn(
                  "w-full rounded-2xl px-4 py-3",
                  theme.input.base,
                  theme.input.focus
                )}
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="max@firma.de"
              />
            </FormField>
          </div>

          <div className="md:w-48">
            <FormField label="Rolle" htmlFor="invite-role">
              <select
                id="invite-role"
                className={cn(
                  "w-full rounded-2xl px-4 py-3",
                  theme.input.base,
                  theme.input.focus
                )}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </FormField>
          </div>

          <button
            disabled={busyInvite}
            className={cn(
              "rounded-2xl px-4 py-3 font-semibold transition hover:scale-[1.02] disabled:opacity-70",
              theme.button.primary
            )}
          >
            {busyInvite ? "Sende…" : "Einladung senden"}
          </button>
        </form>

        {inviteLink && (
          <div className={cn("mt-4 rounded-2xl border px-4 py-3 text-sm", theme.button.warning)}>
            <p className="break-all">{inviteLink}</p>
            <button
              className={cn("mt-2 rounded-xl px-3 py-2 text-sm", theme.button.secondary)}
              onClick={() => copyToClipboard(inviteLink)}
            >
              Link kopieren
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Offene Einladungen
          </h3>
          <p className="text-sm text-zinc-400">
            Noch nicht eingelöste Einladungslinks.
          </p>
        </div>

        {invites.length === 0 ? (
          <div className={cn("rounded-2xl px-4 py-5 text-sm text-zinc-400", theme.surface.softCard)}>
            Keine offenen Einladungen.
          </div>
        ) : (
          <>
            <div className="grid gap-3 lg:hidden">
              {invites.map((inv) => {
                const base =
                  process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin;
                const link = `${base}/invite/${inv.token}`;

                return (
                  <article
                    key={inv.id}
                    className={cn("rounded-[1.5rem] p-4", theme.surface.softCard)}
                  >
                    <div className="space-y-3">
                      <InfoPair label="E-Mail" value={inv.email} />
                      <InfoPair label="Rolle" value={inv.role} />
                      <InfoPair
                        label="Erstellt"
                        value={new Date(inv.createdAt).toLocaleString()}
                      />
                      <InfoPair
                        label="Gültig bis"
                        value={new Date(inv.expiresAt).toLocaleString()}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm",
                          theme.button.secondary
                        )}
                        onClick={() => copyToClipboard(link)}
                      >
                        Link kopieren
                      </button>

                      <button
                        type="button"
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm",
                          theme.button.danger
                        )}
                        onClick={() => revokeInvite(inv.id)}
                      >
                        Widerrufen
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <div className={cn("rounded-[1.5rem]", theme.surface.softCard)}>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-zinc-400">
                      <th className="px-4 py-3">E-Mail</th>
                      <th className="px-4 py-3">Rolle</th>
                      <th className="px-4 py-3">Erstellt</th>
                      <th className="px-4 py-3">Gültig bis</th>
                      <th className="px-4 py-3">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((inv) => {
                      const base =
                        process.env.NEXT_PUBLIC_BASE_URL ??
                        window.location.origin;
                      const link = `${base}/invite/${inv.token}`;

                      return (
                        <tr
                          key={inv.id}
                          className="border-b border-white/10 last:border-b-0"
                        >
                          <td className="px-4 py-3">{inv.email}</td>
                          <td className="px-4 py-3">{inv.role}</td>
                          <td className="px-4 py-3">
                            {new Date(inv.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {new Date(inv.expiresAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={cn(
                                  "rounded-xl px-3 py-2 text-sm",
                                  theme.button.secondary
                                )}
                                onClick={() => copyToClipboard(link)}
                              >
                                Link kopieren
                              </button>

                              <button
                                type="button"
                                className={cn(
                                  "rounded-xl px-3 py-2 text-sm",
                                  theme.button.danger
                                )}
                                onClick={() => revokeInvite(inv.id)}
                              >
                                Widerrufen
                              </button>
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
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Alle Nutzer</h3>
          <p className="text-sm text-zinc-400">
            Rollen ändern, Passwort-Reset auslösen oder Nutzer entfernen.
          </p>
        </div>

        {users.length === 0 ? (
          <div className={cn("rounded-2xl px-4 py-5 text-sm text-zinc-400", theme.surface.softCard)}>
            Keine Nutzer gefunden.
          </div>
        ) : (
          <>
            <div className="grid gap-3 lg:hidden">
              {users.map((u) => (
                <article
                  key={u.id}
                  className={cn("rounded-[1.5rem] p-4", theme.surface.softCard)}
                >
                  <div className="space-y-3">
                    <InfoPair label="Name" value={u.name || "—"} />
                    <InfoPair label="E-Mail" value={u.email} />
                  </div>

                  <div className="mt-4">
                    <FormField label="Rolle" htmlFor={`role-mobile-${u.id}`}>
                      <select
                        id={`role-mobile-${u.id}`}
                        className={cn(
                          "w-full rounded-2xl px-4 py-3",
                          theme.input.base,
                          theme.input.focus
                        )}
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value as Role)}
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </FormField>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm",
                        theme.button.secondary
                      )}
                      onClick={() => sendReset(u.email)}
                    >
                      Passwort-Reset senden
                    </button>

                    <button
                      type="button"
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm",
                        theme.button.danger
                      )}
                      onClick={() => deleteUser(u.id)}
                    >
                      Löschen
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <div className={cn("rounded-[1.5rem]", theme.surface.softCard)}>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-zinc-400">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">E-Mail</th>
                      <th className="px-4 py-3">Rolle</th>
                      <th className="px-4 py-3">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-white/10 last:border-b-0"
                      >
                        <td className="px-4 py-3">{u.name || "—"}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          <select
                            className={cn(
                              "rounded-xl px-3 py-2",
                              theme.input.base,
                              theme.input.focus
                            )}
                            value={u.role}
                            onChange={(e) =>
                              updateRole(u.id, e.target.value as Role)
                            }
                          >
                            <option value="EMPLOYEE">EMPLOYEE</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={cn(
                                "rounded-xl px-3 py-2 text-sm",
                                theme.button.secondary
                              )}
                              onClick={() => sendReset(u.email)}
                            >
                              Passwort-Reset senden
                            </button>

                            <button
                              type="button"
                              className={cn(
                                "rounded-xl px-3 py-2 text-sm",
                                theme.button.danger
                              )}
                              onClick={() => deleteUser(u.id)}
                            >
                              Löschen
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
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

function InfoPair({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-zinc-200">{value}</p>
    </div>
  );
}
