// src/app/admin/users/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";
import SignOutButton from "@/components/SignOutButton";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/admin/users");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin • Mitarbeiter verwalten</h1>
        <div className="space-x-2">
          <a href="/admin/entries" className="rounded-2xl px-3 py-2 border">Zeit-Einträge</a>
          <a href="/admin/users" className="rounded-2xl px-3 py-2 border">Mitarbeiter</a>
          <a href="/dashboard" className="rounded-2xl px-3 py-2 border">Zum Dashboard</a>
          <SignOutButton />
        </div>
      </div>
      <p className="text-sm text-gray-400">Neue Mitarbeiter anlegen, Rollen ändern, Passwörter setzen.</p>
      <UsersClient />
    </div>
  );
}
