import type { ReactNode } from "react";
import Brand from "./Brand";
import Icon from "./Icon";
export default function AuthShell({ children }: { children: ReactNode }) {
  return <main className="dw-auth">
    <aside className="dw-auth-aside">
      <Brand />
      <div className="my-5 md:my-12"><p className="dw-kicker mb-5">Für alle, die den Morgen bringen.</p><h2>Frische Brötchen.<br/>Klare Zeiten.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-stone-600">Dein Fahrerbereich bei Doppelweck. Touren erfassen und Arbeitszeiten im Blick behalten.</p>
        <div className="dw-auth-illustration mt-12 flex items-center gap-5 border-t border-stone-300 pt-6 text-stone-600"><Icon name="sun" width="32" height="32"/><span className="h-px flex-1 bg-stone-300"/><Icon name="bread" width="32" height="32"/><span className="h-px flex-1 bg-stone-300"/><Icon name="truck" width="32" height="32"/></div>
      </div>
      <p className="dw-aside-foot text-xs text-stone-500">Mit Sorgfalt gebacken. Mit Freude geliefert.</p>
    </aside>
    <section className="dw-auth-form"><div>{children}</div></section>
  </main>;
}
