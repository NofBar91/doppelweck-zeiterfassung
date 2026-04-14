// ─────────────────────────────────────────────────────────────
// FILE: src/app/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import TimeEntriesClient from "./TimeEntriesClient";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard");

  const isAdmin = session.user.role === "ADMIN";

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#14110f] text-zinc-100">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,222,179,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(120,72,32,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.12),transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:34px_34px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
          <div className="relative">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-200/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-orange-400/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%,rgba(255,248,240,0.02))]" />

            <div className="relative space-y-6 p-6 sm:p-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="inline-flex items-center rounded-full border border-amber-200/20 bg-amber-100/10 px-3 py-1 text-xs font-medium text-amber-100">
                    Dashboard
                  </span>

                  <h1 className="text-2xl font-semibold text-white">
                    Hallo {session.user.name ?? "Nutzer"}
                  </h1>

                  <p className="text-zinc-300">
                    Rolle: <b className="text-white">{session.user.role}</b>
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {isAdmin && (
                    <>
                      <Link
                        href="/admin/entries"
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                      >
                        Zeit-Einträge
                      </Link>
                      <Link
                        href="/admin/users"
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                      >
                        Mitarbeiter
                      </Link>
                    </>
                  )}

                  <SignOutButton />
                </div>
              </div>

              <TimeEntriesClient />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
