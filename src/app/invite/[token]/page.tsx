"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function InvitePage({ params }: { params: { token: string } }) {
  const { token } = params;
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      // 1) Invite annehmen -> eigener API-Endpoint
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, name, password }),
      });

      if (!res.ok) {
        // ausführliche Fehlermeldung anzeigen
        let msg = await res.text();
        try {
          const j = JSON.parse(msg);
          msg = j?.error || msg;
        } catch {}
        throw new Error(msg || "Einladung konnte nicht angenommen werden.");
      }

      // 2) Direkt einloggen (Credentials)
      const si = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (si?.error) {
        // Login fehlgeschlagen -> zur Login-Seite leiten
        router.push("/login");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Annehmen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Einladung annehmen</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">E-Mail</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Passwort</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button className="rounded-2xl px-4 py-2 border shadow" disabled={busy}>
          {busy ? "Wird übernommen…" : "Annehmen"}
        </button>
      </form>
    </div>
  );
}