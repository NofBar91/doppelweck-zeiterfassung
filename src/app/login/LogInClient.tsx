"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginClient() {
  const sp = useSearchParams();

  // Fehler, die NextAuth ggf. an ?error=... übergibt (z. B. nach Redirect)
  const urlError = sp.get("error");
  // callbackUrl aus Query übernehmen (fällt auf /dashboard zurück)
  const callbackUrl = sp.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      // Kein Auto-Redirect – wir entscheiden selbst nach dem Ergebnis
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl, // wird von NextAuth validiert
      });

      if (!res) {
        setLocalError("Unerwartete Antwort vom Server.");
        return;
      }
      if (res.error) {
        // z. B. CredentialsSignin
        setLocalError(
          res.error === "CredentialsSignin"
            ? "E-Mail oder Passwort ist falsch."
            : "Login fehlgeschlagen."
        );
        return;
      }

      // Erfolg: NextAuth gibt eine URL zurück → dorthin navigieren
      if (res.url) {
        // harte Navigation verhindert Zwischenzustände
        window.location.href = res.url;
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setLocalError("Login fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Login</h1>

      {(urlError || localError) && (
        <p className="text-sm text-red-600">
          {localError ??
            (urlError === "CredentialsSignin"
              ? "E-Mail oder Passwort ist falsch."
              : "Login fehlgeschlagen.")}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm">
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            aria-label="E-Mail"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            aria-label="Passwort"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl px-4 py-2 border shadow disabled:opacity-60"
          >
            {busy ? "Anmeldung…" : "Login"}
          </button>

          <Link href="/reset" className="underline text-sm">
            Passwort vergessen?
          </Link>
        </div>
      </form>
    </div>
  );
}
