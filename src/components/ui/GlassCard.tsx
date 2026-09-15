import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
export default function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-stone-200 bg-white p-5 sm:p-8", className)}>{children}</section>;
}
