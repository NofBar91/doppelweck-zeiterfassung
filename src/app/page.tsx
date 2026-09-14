import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Brand from "@/components/ui/Brand";
import Icon from "@/components/ui/Icon";
export default async function Home() {
  if (await getServerSession(authOptions)) redirect("/dashboard");
  return <div className="min-h-screen"><header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8"><Brand/><Link href="/login" className="dw-secondary rounded-xl px-4 py-3 text-sm font-semibold">Anmelden</Link></header>
    <main className="mx-auto max-w-6xl px-5 pb-12 pt-12 sm:px-8 md:pt-24">
      <div className="grid items-center gap-12 md:grid-cols-[1.15fr_1fr]">
        <section><p className="dw-kicker mb-6">Das Fahrerportal von Doppelweck</p><h1 className="text-5xl font-medium leading-[1.08] tracking-[-.055em] sm:text-6xl">Gute Tour.<br/><span className="text-[#825331]">Alles erfasst.</span></h1><p className="mt-6 max-w-md text-base leading-7 text-stone-600">Du bringst frische Backwaren an die Haustür. Hier finden deine Arbeitszeiten ihren Platz – einfach und übersichtlich.</p><Link href="/login" className="dw-primary mt-8 inline-flex items-center gap-7 rounded-xl px-6 py-4 text-sm font-semibold">Zum Fahrerbereich <Icon name="arrow"/></Link><p className="mt-4 text-xs text-stone-500">Für das gesamte Doppelweck-Team.</p></section>
        <section className="rounded-3xl border border-[#ded7c8] bg-[#ede9de] p-7 sm:p-10"><div className="flex items-center justify-between border-b border-[#d7d1c1] pb-6"><span className="dw-kicker">Ein guter Morgen beginnt im Team.</span><Icon name="sun" width="32" height="32"/></div><div className="py-8"><Icon name="truck" width="64" height="64" className="text-[#825331]"/><h2 className="mt-6 text-3xl font-medium tracking-tight">Von der Backstube<br/>bis zur Haustür.</h2><p className="mt-4 text-sm leading-6 text-stone-600">Ein Ort für deine Touren, Zeiten und Kilometer.</p></div><div className="border-t border-[#d7d1c1] pt-6 text-xs text-stone-600">doppelweck.de · Frische, die ankommt.</div></section>
      </div>
      <div className="mt-16 grid gap-8 border-t border-stone-200 pt-8 sm:grid-cols-3">{[{icon:"clock" as const,title:"Zeiten erfassen",text:"Beginn, Ende und Kilometer deiner Tour festhalten."},{icon:"list" as const,title:"Überblick behalten",text:"Deine Einträge und ihren Freigabestatus einsehen."},{icon:"team" as const,title:"Gemeinsam verwalten",text:"Arbeitszeiten im Team prüfen und exportieren."}].map(x => <div key={x.title}><Icon name={x.icon} className="mb-4 text-[#825331]"/><h2 className="text-sm font-semibold">{x.title}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{x.text}</p></div>)}</div>
    </main><footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-6 text-xs text-stone-500 sm:px-8"><span>Doppelweck · Fahrer-Zeiterfassung</span><a href="https://www.doppelweck.de/" className="underline underline-offset-4">Zur Doppelweck-Website</a></footer>
  </div>;
}
