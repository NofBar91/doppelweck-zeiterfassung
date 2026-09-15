import Link from "next/link";
import Icon from "./Icon";
export default function Brand({ href = "/" }: { href?: string }) {
  return <Link href={href} className="dw-logo" aria-label="Doppelweck Startseite">
    <span className="dw-logo-mark"><Icon name="bread" width="27" height="27" /></span>
    <span><span className="dw-wordmark">doppelweck<small>.de</small></span><span className="block text-[9px] font-semibold uppercase tracking-[.22em] text-stone-500">Fahrer · Zeiterfassung</span></span>
  </Link>;
}
