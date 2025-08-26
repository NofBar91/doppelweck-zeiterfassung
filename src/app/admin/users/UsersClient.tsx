"use client";

import React from "react";
import { toCSV } from "@/lib/csv";

type Role = "ADMIN" | "EMPLOYEE";
type User = { id: string; email: string; name: string; role: Role; createdAt?: string };
type Invite = {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  invitedBy?: { id: string; name: string | null; email: string | null } | null;
};

function download(filename: string, text: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a);
  a.click(); a.remove(); URL.revokeObjectURL(url);
}
function errMsg(e: unknown) { return e instanceof Error ? e.message : "Unbekannter Fehler"; }

export default function UsersClient() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [invites, setInvites] = React.useState<Invite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
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
  React.useEffect(() => { void load(); }, []);

  // ===== Einladungen =====
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<Role>("EMPLOYEE");
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [busyInvite, setBusyInvite] = React.useState(false);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusyInvite(true); setInviteLink(null);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) throw new Error(await res.text());
      const inv = await res.json();
      const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
      const link = `${base}/invite/${inv.token}`;
      setInviteLink(link);
      await load();
    } catch (e: unknown) {
      alert(errMsg(e) || "Einladung fehlgeschlagen");
    } finally {
      setBusyInvite(false);
    }
  }

  async function revokeInvite(id: string) {
    if (!confirm("Einladung widerrufen?")) return;
    const res = await fetch(`/api/admin/invites?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) { alert(await res.text()); return; }
    await load();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert("Link kopiert");
    }).catch(() => alert("Kopieren fehlgeschlagen"));
  }

  // ===== Nutzer-Operationen =====
  async function updateRole(id: string, role: Role) {
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) { alert(await res.text()); return; }
    await load();
  }

  async function deleteUser(id: string) {
    if (!confirm("Nutzer wirklich löschen? Alle zugehörigen Zeiten bleiben bestehen.")) return;
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) { alert(await res.text()); return; }
    await load();
  }

  async function sendReset(email: string) {
    await fetch("/api/auth/request-reset", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    alert("Falls die E-Mail existiert, wurde ein Reset-Link (Konsole) erzeugt.");
  }

  function exportUsersCsv() {
    const headers = ["Name","E-Mail","Rolle","Erstellt"];
    const rows = users.map(u => [u.name, u.email, u.role, u.createdAt ? new Date(u.createdAt).toLocaleString() : ""]);
    const csv = toCSV(headers, rows);
    download(`users_${new Date().toISOString().slice(0,10)}.csv`, csv, "text/csv;charset=utf-8");
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-red-600">{error}</p>}
      {loading && <p>Daten werden geladen…</p>}

      {/* Einladen */}
      <section className="p-4 border rounded-2xl space-y-3">
        <h2 className="font-semibold">Nutzer einladen</h2>
        <form onSubmit={createInvite} className="flex flex-col md:flex-row gap-2 md:items-end">
          <div className="flex-1">
            <label className="block text-sm mb-1">E-Mail</label>
            <input className="w-full border rounded px-3 py-2" type="email"
                   value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Rolle</label>
            <select className="border rounded px-3 py-2" value={inviteRole} onChange={e=>setInviteRole(e.target.value as Role)}>
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <button disabled={busyInvite} className="rounded-2xl px-4 py-2 border shadow">
            {busyInvite ? "Sende…" : "Einladen"}
          </button>
          <button type="button" onClick={exportUsersCsv} className="rounded-2xl px-4 py-2 border shadow">
            Nutzer als CSV
          </button>
        </form>
        {inviteLink && (
          <p className="text-sm">
            Einladungslink:&nbsp;
            <a className="underline" href={inviteLink}>{inviteLink}</a>{" "}
            <button className="underline" onClick={()=>copy(inviteLink)}>Kopieren</button>
          </p>
        )}
      </section>

      {/* Offene Einladungen */}
      <section className="space-y-2">
        <h3 className="font-semibold">Offene Einladungen</h3>
        {invites.length === 0 ? (
          <p className="text-sm text-gray-500">Keine offenen Einladungen.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">E-Mail</th>
                  <th className="py-2 pr-4">Rolle</th>
                  <th className="py-2 pr-4">Erstellt</th>
                  <th className="py-2 pr-4">Gültig bis</th>
                  <th className="py-2 pr-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {invites.map(inv => {
                  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
                  const link = `${base}/invite/${inv.token}`;
                  return (
                    <tr key={inv.id} className="border-b">
                      <td className="py-2 pr-4">{inv.email}</td>
                      <td className="py-2 pr-4">{inv.role}</td>
                      <td className="py-2 pr-4">{new Date(inv.createdAt).toLocaleString()}</td>
                      <td className="py-2 pr-4">{new Date(inv.expiresAt).toLocaleString()}</td>
                      <td className="py-2 pr-4 space-x-2">
                        <button className="underline" onClick={()=>copy(link)}>Link kopieren</button>
                        <button className="underline text-red-600" onClick={()=>revokeInvite(inv.id)}>Widerrufen</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Nutzerliste */}
      <section className="space-y-2">
        <h3 className="font-semibold">Alle Nutzer</h3>
        {users.length === 0 ? (
          <p className="text-sm text-gray-500">Keine Nutzer gefunden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">E-Mail</th>
                  <th className="py-2 pr-4">Rolle</th>
                  <th className="py-2 pr-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="py-2 pr-4">{u.name}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">
                      <select
                        className="border rounded px-2 py-1"
                        value={u.role}
                        onChange={e=>updateRole(u.id, e.target.value as Role)}
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4 space-x-2">
                      <button className="underline" onClick={()=>sendReset(u.email)}>Passwort-Reset senden</button>
                      <button className="underline text-red-600" onClick={()=>deleteUser(u.id)}>Löschen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
