// src/app/admin/users/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";

import PageShell from "@/components/ui/PageShell";
import GlassCard from "@/components/ui/GlassCard";
import { getActiveTheme } from "@/lib/theme-server";
import { cn } from "@/lib/cn";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/admin/users");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const theme = getActiveTheme();

  return (
    <PageShell maxWidth="7xl">
      <GlassCard>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                theme.badge.base
              )}
            >
              {theme.labels.admin}
            </span>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
              Admin • Mitarbeiter verwalten
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-400 sm:text-base">
              Neue Mitarbeiter anlegen, Rollen ändern und Passwörter verwalten –
              im gleichen Look wie der restliche Adminbereich.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:justify-end">
            <Link
              href="/admin/entries"
              className={cn(
                "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium transition",
                theme.button.secondary
              )}
            >
              Zeit-Einträge
            </Link>

            <Link
              href="/admin/users"
              className={cn(
                "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium",
                theme.badge.base
              )}
            >
              Mitarbeiter
            </Link>

            <Link
              href="/dashboard"
              className={cn(
                "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium transition",
                theme.button.secondary
              )}
            >
              Zum Dashboard
            </Link>

            <div className={cn("rounded-2xl px-1 py-1", theme.button.secondary)}>
              <SignOutButton />
            </div>
          </div>
        </div>

        <div className={cn("mt-6 rounded-[1.5rem] p-4 sm:mt-8 sm:p-5", theme.surface.softCard)}>
          <UsersClient />
        </div>
      </GlassCard>
    </PageShell>
  );
}
