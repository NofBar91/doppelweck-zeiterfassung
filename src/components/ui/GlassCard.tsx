// src/components/ui/GlassCard.tsx
import React from "react";
import { cn } from "@/lib/cn";
import { getActiveTheme } from "@/lib/theme-server";

export default function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const theme = getActiveTheme();

  return (
    <section className={cn("overflow-hidden rounded-[2rem]", theme.surface.card, className)}>
      <div className="relative">
        <div className={cn("pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl", theme.surface.glowTop)} />
        <div className={cn("pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full blur-3xl", theme.surface.glowBottom)} />
        <div className={cn("pointer-events-none absolute inset-0", theme.surface.overlay)} />
        <div className="relative p-5 sm:p-8">{children}</div>
      </div>
    </section>
  );
}
