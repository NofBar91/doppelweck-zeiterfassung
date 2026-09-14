"use client";
import React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import AuthShell from "./AuthShell";

export default function AccountForm({ mode, token }: { mode: "forgot" | "reset" | "invite"; token?: string }) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const title = { forgot: "Passwort vergessen?", reset: "Ein neuer Zugang.", invite: "Willkommen im Team." }[mode];
  const description = { forgot: "Wir senden dir einen Link, mit dem du ein neues Passwort festlegen kannst.", reset: "Lege dein neues Passwort fest. Verwende mindestens 8 Zeichen.", invite: "Vervollständige deinen Zugang, um deine Touren zu erfassen." }[mode];
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setError(null);
    try {
      const endpoint = { forgot: "request-reset", reset: "reset-password", invite: "accept-invite" }[mode];
      const res = await fetch(`/api/auth/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, name, password, token }) });
      if (!res.ok) {
        const raw = await res.text(); let message = raw;
        try { message = JSON.parse(raw).error || raw; } catch {}
        throw new Error(message || "Das hat nicht geklappt. Bitte versuche es erneut.");
      }
      if (mode === "invite") {
        const login = await signIn("credentials", { redirect: false, email, password });
        window.location.assign(login?.ok ? "/dashboard" : "/login");
      } else { setDone(true); }
    } catch (err) { setError(err instanceof Error ? err.message : "Keine Verbindung. Bitte versuche es erneut."); }
    finally { setBusy(false); }
  }
  return <AuthShell><p className="dw-kicker mb-4">Doppelweck · Fahrerbereich</p><h1 className="dw-title">{title}</h1><p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {done ? <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{mode === "forgot" ? "Falls ein Zugang mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet. Bitte prüfe auch deinen Spam-Ordner." : "Dein Passwort wurde geändert. Du kannst dich jetzt damit anmelden."}</p> : <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={busy}>
      {mode !== "reset" && <div><label htmlFor="account-email" className="dw-field">E-Mail</label><input id="account-email" type="email" autoComplete="email" required className="dw-input w-full rounded-xl px-4 py-3" value={email} onChange={e=>setEmail(e.target.value)}/></div>}
      {mode === "invite" && <div><label htmlFor="account-name" className="dw-field">Name</label><input id="account-name" autoComplete="name" required className="dw-input w-full rounded-xl px-4 py-3" value={name} onChange={e=>setName(e.target.value)}/></div>}
      {mode !== "forgot" && <div><label htmlFor="account-password" className="dw-field">Neues Passwort</label><input id="account-password" type="password" autoComplete="new-password" minLength={8} required className="dw-input w-full rounded-xl px-4 py-3" value={password} onChange={e=>setPassword(e.target.value)}/><p className="mt-2 text-xs text-stone-500">Mindestens 8 Zeichen.</p></div>}
      <button disabled={busy} className="dw-primary w-full rounded-xl px-5 py-3 font-semibold disabled:opacity-60">{busy ? "Bitte warten…" : { forgot: "Link senden", reset: "Passwort speichern", invite: "Zugang aktivieren" }[mode]}</button>
    </form>}<Link href="/login" className="mt-6 inline-block text-sm text-[#825331] underline underline-offset-4">Zur Anmeldung</Link>
  </AuthShell>;
}
