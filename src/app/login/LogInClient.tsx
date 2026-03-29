"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginClient() {
  const sp = useSearchParams();

  const urlError = sp.get("error");
  const callbackUrl = sp.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setLocalError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (!res) {
        setLocalError("Unerwartete Antwort vom Server.");
        setBusy(false);
        return;
      }

      if (res.error) {
        setLocalError(
          res.error === "CredentialsSignin"
            ? "E-Mail oder Passwort ist falsch."
            : "Login fehlgeschlagen."
        );
        setBusy(false);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        if (res.url) {
          window.location.href = res.url;
        } else {
          window.location.href = callbackUrl;
        }
      }, 1100);
    } catch {
      setLocalError("Login fehlgeschlagen.");
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#0b0b0f] text-zinc-100">
      {/* Hintergrund */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:34px_34px]" />
      </div>

      {/* weiche Osterformen */}
      <div className="pointer-events-none absolute left-[-30px] top-[18%] h-28 w-20 rotate-[-18deg] rounded-[999px] bg-gradient-to-b from-amber-200/25 to-pink-300/10 blur-sm md:left-[8%] md:h-40 md:w-28" />
      <div className="pointer-events-none absolute right-[-20px] top-[16%] h-24 w-16 rotate-[16deg] rounded-[999px] bg-gradient-to-b from-cyan-200/20 to-amber-200/10 blur-sm md:right-[10%] md:h-36 md:w-24" />
      <div className="pointer-events-none absolute bottom-[14%] left-[-15px] h-20 w-14 rotate-[12deg] rounded-[999px] bg-gradient-to-b from-pink-200/20 to-amber-100/10 blur-sm md:left-[12%] md:h-28 md:w-20" />
      <div className="pointer-events-none absolute bottom-[12%] right-[-12px] h-20 w-14 rotate-[-12deg] rounded-[999px] bg-gradient-to-b from-amber-200/20 to-cyan-200/10 blur-sm md:right-[12%] md:h-28 md:w-20" />

      <div
        className="relative z-10 flex min-h-[100svh] items-center justify-center px-5 py-8"
        style={{
          paddingTop: "max(1.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
          paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        }}
      >
        <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%,rgba(255,255,255,0.02))]" />
          <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-amber-300/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-pink-300/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3 shadow-[0_10px_40px_rgba(251,191,36,0.08)]">
                <img
                  src="/icons/icon-192.png"
                  alt="Doppelweck Logo"
                  className="h-16 w-16 rounded-xl object-cover"
                />
              </div>

              <span className="mt-4 inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
                🐣 Willkommen zurück
              </span>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                Login
              </h1>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Melde dich an, um deine Zeiten sicher und mobil zu verwalten.
              </p>
            </div>

            {(urlError || localError) && (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {localError ??
                  (urlError === "CredentialsSignin"
                    ? "E-Mail oder Passwort ist falsch."
                    : "Login fehlgeschlagen.")}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  aria-label="E-Mail"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-300/40 focus:bg-black/30 focus:ring-2 focus:ring-amber-200/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  placeholder="name@doppelweck.de"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Passwort
                </label>
                <input
                  id="password"
                  type="password"
                  aria-label="Passwort"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-300/40 focus:bg-black/30 focus:ring-2 focus:ring-amber-200/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="group inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-300/90 via-amber-200/90 to-pink-200/90 px-5 py-3 font-semibold text-zinc-950 shadow-[0_10px_40px_rgba(251,191,36,0.22)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busy ? (
                    success ? (
                      <span className="flex items-center gap-3">
                        <Bunny success />
                        Anmeldung erfolgreich…
                      </span>
                    ) : (
                      "Anmeldung…"
                    )
                  ) : (
                    "Login"
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center pt-1">
                <Link
                  href="/reset"
                  className="text-sm text-zinc-400 underline decoration-zinc-600 underline-offset-4 transition hover:text-zinc-200"
                >
                  Passwort vergessen?
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function Bunny({ success = false }: { success?: boolean }) {
  return (
    <span
      className={`relative inline-block h-6 w-8 ${
        success ? "animate-bunny-hop" : ""
      }`}
      aria-hidden="true"
    >
      <span className="absolute bottom-0 left-0 h-4 w-6 rounded-full bg-zinc-950" />
      <span className="absolute bottom-2 left-3 h-3 w-3 rounded-full bg-zinc-950" />
      <span className="absolute -top-1 left-4 h-3 w-[3px] rounded-full bg-zinc-950" />
      <span className="absolute -top-1 left-[21px] h-3 w-[3px] rounded-full bg-zinc-950" />
    </span>
  );
}
