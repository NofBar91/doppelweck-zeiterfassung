// src/app/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Doppelweck • Zeiterfassung",
  description:
    "Sichere, schnelle und einfache Zeiterfassung für den Doppelweck-Lieferservice.",
};

export default function Home() {
  return (
    <main className="relative flex min-h-[100svh] overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950 via-zinc-950 to-black text-zinc-100">
      {/* Hintergrund Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl animate-pulse" />
        <div className="absolute left-4 top-20 h-40 w-40 rounded-full bg-pink-400/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-6 right-4 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl animate-pulse" />
      </div>

      {/* Eier */}
      <FloatingEgg className="left-[6%] top-[12%] opacity-60 scale-75 md:scale-100" delay="0s" />
      <FloatingEgg className="right-[6%] top-[18%] opacity-60 scale-75 md:scale-100" delay="1.4s" />
      <FloatingEgg className="left-[10%] bottom-[10%] opacity-50 scale-75 md:scale-100" delay="2.2s" />
      <FloatingEgg className="right-[10%] bottom-[8%] opacity-50 scale-75 md:scale-100" delay="0.8s" />

      {/* Hase */}
      <Bunny />

      <div
        className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <div className="w-full max-w-3xl">
          <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl sm:rounded-3xl">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

            <div className="relative grid gap-6 p-5 sm:gap-8 sm:p-8 md:grid-cols-[1fr,auto] md:p-12">
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <div className="relative mb-4 animate-float">
                  <div className="absolute inset-0 rounded-full bg-amber-300/20 blur-2xl" />
                  <img
                    src="/icons/icon-192.png"
                    alt="Logo"
                    className="relative h-24 w-24 sm:h-32 sm:w-32 md:h-[180px] md:w-[180px]"
                  />
                </div>

                <span className="mb-3 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-200">
                  🐣 Oster-Special
                </span>

                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-5xl">
                  Doppelweck&nbsp;Lieferservice
                </h1>

                <p className="mt-3 text-sm text-zinc-300 sm:text-base md:text-lg">
                  Die unternehmensweite Zeiterfassung – schnell, sicher und mobil.
                  Jetzt im neuen Osterlook
                  Allen Mitarbeitern eine frohe Osterzeit ! 
                </p>

                <div className="mt-6 w-full sm:w-auto">
                  <Link
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-r from-amber-300/20 via-white/10 to-pink-300/20 px-5 py-3 font-medium transition hover:scale-[1.02] sm:w-auto"
                  >
                    Zum Login →
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 text-sm">
                <Feature line1="Schnell erfassen" line2="per Knopfdruck" />
                <Feature line1="Freigabe" line2="für Vorgesetzte" />
                <Feature line1="Export" line2="CSV möglich" />
                <Feature line1="Rollen" line2="Admin / Mitarbeiter" />
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-zinc-500">
            © {new Date().getFullYear()} Doppelweck
          </p>
        </div>
      </div>
    </main>
  );
}

function Feature({ line1, line2 }: { line1: string; line2: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="font-semibold">{line1}</p>
      <p className="text-zinc-400">{line2}</p>
    </div>
  );
}

function FloatingEgg({
  className = "",
  delay = "0s",
}: {
  className?: string;
  delay?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute animate-float-slow ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className="relative h-14 w-10 rounded-[999px] bg-gradient-to-b from-pink-300/80 via-amber-200/70 to-cyan-300/70 shadow-[0_0_30px_rgba(255,255,255,0.08)]">
        <div className="absolute left-2 right-2 top-3 h-1 rounded-full bg-white/40" />
        <div className="absolute left-2.5 right-2.5 top-6 h-1 rounded-full bg-white/30" />
        <div className="absolute left-2 right-2 top-9 h-1 rounded-full bg-white/40" />
      </div>
    </div>
  );
}

function Bunny() {
  return (
    <div className="pointer-events-none absolute bottom-4 right-6 animate-bunny opacity-80">
      <div className="relative">
        <div className="h-6 w-10 rounded-full bg-white/80" />
        <div className="absolute -top-3 left-5 h-5 w-5 rounded-full bg-white/90" />
        <div className="absolute -top-6 left-6 h-5 w-1.5 rounded-full bg-white/80" />
        <div className="absolute -top-6 left-8 h-5 w-1.5 rounded-full bg-white/80" />
      </div>
    </div>
  );
}
