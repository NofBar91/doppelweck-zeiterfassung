// ─────────────────────────────────────────────────────────────
// FILE: src/app/admin/entries/page.tsx (Server Component + RBAC)
// ─────────────────────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminEntriesClient from "./AdminEntriesClient";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default async function AdminEntriesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/admin/entries");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="p-6 space-y-4">
      {/* NEW: simple top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Admin • Arbeitszeiten</h1>
          <p className="text-sm text-gray-600">
            Filtere nach Mitarbeiter, Zeitraum oder Ort. Änderungen werden protokolliert.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="rounded-2xl px-3 py-2 border shadow">Zum Dashboard</Link>
        <SignOutButton />
        </div>
      </div>

      <AdminEntriesClient />
    </div>
  );
}
