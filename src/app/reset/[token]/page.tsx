"use client";
import React from "react";

export default function ResetPage({ params }: { params: { token: string } }) {
  const [password, setPassword] = React.useState("");
  const [done, setDone] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, password }),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    setDone(true);
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-3">
      <h1 className="text-2xl font-semibold">Neues Passwort</h1>
      {done ? (
        <p>Dein Passwort wurde geändert. Du kannst dich jetzt anmelden.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm">Neues Passwort</label>
            <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button className="rounded-2xl px-4 py-2 border shadow">Speichern</button>
        </form>
      )}
    </div>
  );
}
