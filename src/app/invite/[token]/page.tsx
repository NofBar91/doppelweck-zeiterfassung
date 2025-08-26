"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          name,
          password,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Einladung konnte nicht angenommen werden.");
      }
      setDone(true);
      // Optional direkt zum Login leiten:
      // router.push("/login");
      // return;
    } catch (e: any) {
      setError(e?.message ?? "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Einladung annehmen</h1>

      {done ? (
        <div className="space-y-3">
          <p className="text-green-700">Dein Konto wurde erstellt. Du kannst dich jetzt einloggen.</p>
          <a href="/login" className="rounded-2xl px-4 py-2 border shadow inline-block">Zum Login</a>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Passwort</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-2xl px-4 py-2 border shadow disabled:opacity-60"
            >
              {busy ? "Erstelle Konto…" : "Konto erstellen"}
            </button>
            <span className="text-xs text-gray-500">
              Token: {params.token.slice(0, 8)}…
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
