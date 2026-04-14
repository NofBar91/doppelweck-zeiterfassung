// ─────────────────────────────────────────────────────────────
// FILE: src/app/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import TimeEntriesClient from "./TimeEntriesClient";
import SignOutButton from "@/components/SignOutButton";

import PageShell from "@/components/ui/PageShell";
import GlassCard from "@/components/ui/GlassCard";
import { getActiveTheme } from "@/lib/theme-server";
import { cn } from "@/lib/cn";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard");

  const theme = getActiveTheme();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <PageShell maxWidth="6xl">
      <GlassCard>
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="space-y-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                  theme.badge.base
                )}
              >
                Dashboard
              </span>

              <h1 className="text-2xl font-semibold text-white">
                Hallo {session.user.name ?? "Nutzer"}
              </h1>

              <p className="text-zinc-300">
                Rolle: <b className="text-white">{session.user.role}</b>
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {isAdmin && (
                <>
                  <Link
                    href="/admin/entries"
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm font-medium transition",
                      theme.button.secondary
                    )}
                  >
                    Zeit-Einträge
                  </Link>

                  <Link
                    href="/admin/users"
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm font-medium transition",
                      theme.button.secondary
                    )}
                  >
                    Mitarbeiter
                  </Link>
                </>
              )}

              <SignOutButton />
            </div>
          </div>

          {/* Content */}
          <TimeEntriesClient />
        </div>
      </GlassCard>
    </PageShell>
  );
}
