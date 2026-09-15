"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import AuthShell from "@/components/ui/AuthShell";
import Icon from "@/components/ui/Icon";

export default function LoginClient() {
  const sp = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await signIn("credentials", { redirect: false, email, password, callbackUrl: sp.get("callbackUrl") || "/dashboard" });
      if (!res || res.error) throw new Error(res?.error === "CredentialsSignin" ? "E-Mail oder Passwort ist falsch. Bitte prüfe deine Eingaben." : "Die Anmeldung ist fehlgeschlagen. Bitte versuche es erneut.");
      const destination = new URL(res.url || "/dashboard", window.location.origin);
      window.location.assign(destination.origin === window.location.origin ? destination.href : "/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "Keine Verbindung. Bitte versuche es erneut."); setBusy(false); }
  }
  return <AuthShell><p className="dw-kicker mb-4">Dein Team. Dein Zugang.</p><h1 className="dw-title">Willkommen zurück.</h1><p className="mt-3 text-sm leading-6 text-stone-600">Melde dich an, um deine Arbeitszeiten zu erfassen.</p>
    {(error || sp.get("error")) && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error || "Die Anmeldung ist fehlgeschlagen. Bitte melde dich erneut an."}</p>}
    <form onSubmit={onSubmit} className="mt-8 space-y-5" aria-busy={busy}>
      <div><label htmlFor="email" className="dw-field">E-Mail</label><input id="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={e=>setEmail(e.target.value)} required className="dw-input w-full rounded-xl px-4 py-3" placeholder="deine@email.de"/></div>
      <div><label htmlFor="password" className="dw-field">Passwort</label><div className="relative"><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required className="dw-input w-full rounded-xl py-3 pl-4 pr-24"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-pressed={showPassword} aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"} className="absolute right-2 top-1 px-2 text-xs text-stone-600">{showPassword ? "Verbergen" : "Anzeigen"}</button></div></div>
      <div className="text-right"><Link href="/forgot" className="text-sm text-[#825331] underline underline-offset-4">Passwort vergessen?</Link></div>
      <button type="submit" disabled={busy} className="dw-primary flex w-full items-center justify-between rounded-xl px-5 py-3.5 text-sm font-semibold disabled:opacity-60">{busy ? "Wird angemeldet…" : "Anmelden"}<Icon name="arrow"/></button>
    </form><p className="mt-8 border-t border-stone-200 pt-6 text-xs leading-6 text-stone-500">Noch kein Zugang? Du erhältst deine Einladung von der Doppelweck-Verwaltung.</p>
  </AuthShell>;
}
