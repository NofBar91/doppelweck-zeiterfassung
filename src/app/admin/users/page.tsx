// src/app/admin/users/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/admin/users");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#14110f] text-zinc-100">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,222,179,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(120,72,32,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.12),transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:34px_34px]" />
      </div>

      <div
        className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8"
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
          <div className="relative">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-200/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-orange-400/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%,rgba(255,248,240,0.02))]" />

            <div className="relative p-5 sm:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center rounded-full border border-amber-200/20 bg-amber-100/10 px-3 py-1 text-xs font-medium text-amber-100">
                    Admin-Bereich
                  </span>

                  <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
                    Admin • Mitarbeiter verwalten
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-zinc-400 sm:text-base">
                    Neue Mitarbeiter anlegen, Rollen ändern und Passwörter
                    verwalten – im gleichen Look wie der restliche Adminbereich.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:justify-end">
                  <Link
                    href="/admin/entries"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    Zeit-Einträge
                  </Link>

                  <Link
                    href="/admin/users"
                    className="inline-flex items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-100/10 px-4 py-3 text-sm font-medium text-amber-100"
                  >
                    Mitarbeiter
                  </Link>

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    Zum Dashboard
                  </Link>

                  <div className="rounded-2xl border border-white/10 bg-white/10 px-1 py-1">
                    <SignOutButton />
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:mt-8 sm:p-5">
                <UsersClient />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
