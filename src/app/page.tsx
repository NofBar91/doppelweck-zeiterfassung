// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "DKW Sicherheits-Service • Zeiterfassung",
  description:
    "Sichere, schnelle und einfache Zeiterfassung für den DKW Sicherheits-Service.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl mx-auto">
        {/* Hero-Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl">
          {/* Deko-Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative grid gap-6 p-8 md:grid-cols-[1fr,auto] md:gap-10 md:p-12">
            {/* Logo + Claim */}
            <div className="flex flex-col items-center md:items-start">
              <div className="mb-6">
                <Image
                  src="/icons/icon-192.png"
                  alt="DKW Sicherheits-Service Logo"
                  width={220}
                  height={220}
                  priority
                  className="h-auto w-40 md:w-56"
                />
              </div>

              <h1 className="text-center md:text-left text-3xl md:text-4xl font-extrabold tracking-tight">
                DKW&nbsp;Sicherheits-Service
              </h1>
              <p className="mt-3 text-center md:text-left text-zinc-300 max-w-prose">
                Die unternehmensweite Zeiterfassung – schnell, sicher und
                mobil. Für Mitarbeiter, Team-Leads und Admins.
              </p>

              {/* CTA */}
              <div className="mt-8">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-medium backdrop-blur hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  Zum Login
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="ml-2 h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 01.083 1.32l-.083.094-5 5a1 1 0 01-1.497-1.32l.083-.094L13.585 11H4a1 1 0 01-.117-1.993L4 9h9.585l-3.292-3.293a1 1 0 01-.083-1.32l.083-.094z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Mini-Fakten */}
            <div className="mt-2 grid h-fit gap-3 text-sm text-zinc-300">
              <Feature line1="Schnell erfassen" line2="Start/Stop oder Zeiten" />
              <Feature line1="Prüfen & freigeben" line2="für Vorgesetzte" />
              <Feature line1="Export" line2="CSV für Lohn & Controlling" />
              <Feature line1="Rollen & Rechte" line2="Admin / Mitarbeiter" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} DKW Sicherheits-Service – Zeiterfassung
        </p>
      </div>
    </main>
  );
}

function Feature({ line1, line2 }: { line1: string; line2: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="font-semibold text-zinc-100">{line1}</p>
      <p className="text-zinc-400">{line2}</p>
    </div>
  );
}
