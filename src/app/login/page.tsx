"use client";
import React from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = React.useState("max@example.com");
  const [password, setPassword] = React.useState("Mitarb!234");
  const [error, setError] = React.useState<string | null>(null);
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/dashboard";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    if (res?.error) setError("Login fehlgeschlagen. Bitte prüfe E-Mail/Passwort.");
    else if (res?.ok) window.location.href = callbackUrl;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 p-6 rounded-2xl shadow border">
        <h1 className="text-2xl font-semibold">Anmelden</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm">E-Mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm">Passwort</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="w-full rounded-2xl px-4 py-2 border shadow">Login</button>

        <p className="text-xs text-gray-500">
          Testnutzer: <b>max@example.com / Mitarb!234</b><br/>
          Admin: <b>chef@example.com / Admin!234</b>
        </p>
      </form>
    </div>
  );
}
