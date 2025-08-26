// ─────────────────────────────────────────────────────────────
// FILE: src/app/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import TimeEntriesClient from "./TimeEntriesClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard");

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Hallo {session.user.name ?? "Nutzer"} 👋
        </h1>
        <p>
          Rolle: <b>{session.user.role}</b>
        </p>

        <div className="space-x-3">
          {isAdmin && (
            <>
              <Link href="/admin/entries" className="underline">
                Zur Admin-Ansicht
              </Link>
              <Link href="/admin/users" className="underline">
                Mitarbeiter
              </Link>
            </>
          )}
          <a href="/api/auth/signout?callbackUrl=/login" className="underline">
            Logout
          </a>
        </div>
      </div>

      <TimeEntriesClient />
    </div>
  );
}
