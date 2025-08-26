"use client";
import React from "react";

export default function ForgotPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/auth/request-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
  };
  return (
    <div className="p-6 max-w-md mx-auto space-y-3">
      <h1 className="text-2xl font-semibold">Passwort zurücksetzen</h1>
      {sent ? (
        <p>Falls die E-Mail existiert, wurde ein Link gesendet.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm">E-Mail</label>
            <input className="w-full border rounded px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <button className="rounded-2xl px-4 py-2 border shadow">Link senden</button>
        </form>
      )}
    </div>
  );
}
