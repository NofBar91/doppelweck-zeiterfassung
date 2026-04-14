// src/app/page.tsx
import Link from "next/link";
import PageShell from "@/components/ui/PageShell";
import { getActiveTheme } from "@/lib/theme-server";
import { cn } from "@/lib/cn";

export const metadata = {
  title: "Doppelweck • Zeiterfassung",
  description:
    "Sichere, schnelle und einfache Zeiterfassung für den Doppelweck-Lieferservice.",
};

export default function Home() {
  const theme = getActiveTheme();

  return (
    <PageShell maxWidth="6xl">
      {/* weiche Formen */}
      <div className="pointer-events-none absolute left-[-40px] top-[18%] h-32 w-24 rotate-[-18deg] rounded-[999px] bg-gradient-to-b from-amber-100/15 to-orange-400/10 blur-sm md:left-[6%] md:h-44 md:w-32" />
      <div className="pointer-events-none absolute right-[-30px] top-[14%] h-28 w-20 rotate-[16deg] rounded-[999px] bg-gradient-to-b from-stone-200/10 to-amber-300/10 blur-sm md:right-[8%] md:h-40 md:w-28" />
      <div className="pointer-events-none absolute bottom-[16%] left-[-20px] h-24 w-16 rotate-[12deg] rounded-[999px] bg-gradient-to-b from-orange-300/10 to-amber-100/10 blur-sm md:left-[10%] md:h-32 md:w-24" />
      <div className="pointer-events-none absolute bottom-[12%] right-[-16px] h-24 w-16 rotate-[-12deg] rounded-[999px] bg-gradient-to-b from-amber-200/10 to-yellow-100/10 blur-sm md:right-[10%] md:h-32 md:w-24" />

      <div
        className="relative z-10 flex min-h-[100svh] w-full items-center px-5 py-8 sm:px-8"
        style={{
          paddingTop: "max(1.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
          paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        }}
      >
        <section className="grid w-full items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
          {/* Linke Seite */}
          <div className="text-center md:text-left">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-4 py-2 text-xs font-medium tracking-wide backdrop-blur",
                theme.badge.base
              )}
            >
              Doppelweck Zeiterfassung
            </span>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Zeiterfassung,
              <span className="block bg-gradient-to-r from-amber-100 via-white to-orange-200 bg-clip-text text-transparent">
                modern und einfach.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg md:mx-0">
              Für Doppelweck gemacht: Arbeitszeiten schnell erfassen, sicher
              verwalten und mobil nutzen.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                href="/login"
                className={cn(
                  "inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition hover:scale-[1.02]",
                  theme.button.primary
                )}
              >
                Zum Login
              </Link>

              <div className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 backdrop-blur">
                Sicher • Schnell • Mobil
              </div>
            </div>
          </div>

          {/* Rechte Seite */}
          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-amber-200/10 via-transparent to-orange-300/10 blur-2xl" />

            <div
              className={cn(
                "relative overflow-hidden rounded-[2rem] p-6 sm:p-8",
                theme.surface.card
              )}
            >
              <div
                className={cn("absolute inset-0", theme.surface.overlay)}
              />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                      Doppelweck
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Zeiterfassung
                    </h2>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                    <img
                      src="/icons/icon-192.png"
                      alt="Doppelweck Logo"
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <PreviewRow
                    label=""
                    value="Arbeitszeiten erfassen"
                    accent="from-amber-100/20 to-amber-50/5"
                  />
                  <PreviewRow
                    label=""
                    value="Einfach verwalten"
                    accent="from-orange-200/20 to-orange-100/5"
                  />
                  <PreviewRow
                    label=""
                    value="Mobil verfügbar"
                    accent="from-stone-200/15 to-stone-100/5"
                  />
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <MiniStat value="CSV" label="Export" />
                  <MiniStat value="Admin" label="Rollen" />
                  <MiniStat value="Mobil" label="Zugriff" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function PreviewRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-r ${accent} px-4 py-4`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4 text-center">
      <p className="text-sm font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{label}</p>
    </div>
  );
}
