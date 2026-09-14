import Link from "next/link";
import Brand from "./Brand";
import Icon from "./Icon";
import SignOutButton from "@/components/SignOutButton";
export default function AppHeader({ active, isAdmin, name }: { active: "time" | "entries" | "users"; isAdmin: boolean; name?: string | null }) {
  const links = [{ href: "/dashboard", label: "Meine Zeiten", icon: "clock" as const, key: "time" }, ...(isAdmin ? [{ href: "/admin/entries", label: "Arbeitszeiten", icon: "list" as const, key: "entries" }, { href: "/admin/users", label: "Mitarbeiter", icon: "team" as const, key: "users" }] : [])];
  return <header className="border-b border-stone-200 bg-white">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:block focus:p-4">Zum Inhalt springen</a>
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-4 py-4 sm:px-8">
      <Brand href="/dashboard" />
      <nav aria-label="Hauptnavigation" className="dw-nav order-3 md:order-none md:w-auto">{links.map(link => <Link key={link.key} href={link.href} aria-current={active === link.key ? "page" : undefined}><Icon name={link.icon}/>{link.label}</Link>)}</nav>
      <div className="flex items-center gap-3"><span className="hidden text-right text-xs text-stone-500 lg:block"><b className="block font-medium text-stone-800">{name || "Doppelweck-Team"}</b>{isAdmin ? "Verwaltung" : "Fahrerteam"}</span><SignOutButton /></div>
    </div>
  </header>;
}
