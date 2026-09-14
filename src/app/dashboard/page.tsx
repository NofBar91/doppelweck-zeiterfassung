import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TimeEntriesClient from "./TimeEntriesClient";
import AppHeader from "@/components/ui/AppHeader";
import PageShell from "@/components/ui/PageShell";
export const metadata = { title: "Meine Zeiten" };
export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard");

  return <><AppHeader active="time" isAdmin={session.user.role === "ADMIN"} name={session.user.name} />
    <PageShell maxWidth="7xl"><div className="mb-8"><p className="dw-kicker mb-3">Doppelweck · Fahrerbereich</p><h1 className="dw-title">Hallo {session.user.name?.split(" ")[0] || "Doppelweck-Team"}.</h1><p className="mt-3 text-sm text-stone-600">Deine Touren und Arbeitszeiten an einem Ort.</p></div><TimeEntriesClient /></PageShell>
  </>;
}
