import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminEntriesClient from "./AdminEntriesClient";
import AppHeader from "@/components/ui/AppHeader";
import PageShell from "@/components/ui/PageShell";
export const metadata = { title: "Arbeitszeiten" };
export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/admin/entries");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return <><AppHeader active="entries" isAdmin={session.user.role === "ADMIN"} name={session.user.name} />
    <PageShell maxWidth="7xl"><div className="mb-8"><p className="dw-kicker mb-3">Doppelweck · Verwaltung</p><h1 className="dw-title">Arbeitszeiten</h1><p className="mt-3 text-sm text-stone-600">Touren prüfen, Zeiten freigeben und Abrechnungen exportieren.</p></div><AdminEntriesClient /></PageShell>
  </>;
}
