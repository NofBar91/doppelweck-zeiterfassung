"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginClient() {
  const sp = useSearchParams();
  const error = sp.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      // Standard NextAuth Credentials-Login
      const res = await signIn("credentials", {
        redirect: true,
        email,
        password,
        callbackUrl: "/dashboard",
      });
      // signIn handled redirect
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Login</h1>

      {error && (
        <p className="text-sm text-red-600">
          {error === "CredentialsSignin" ? "E-Mail oder Passwort ist falsch." : "Login fehlgeschlagen."}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm">E-Mail</label>
          <input
            id="email"
            type="email"
            aria-label="E-Mail"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm">Passwort</label>
          <input
            id="password"
            type="password"
            aria-label="Passwort"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl px-4 py-2 border shadow"
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
