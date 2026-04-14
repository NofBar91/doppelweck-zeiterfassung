// src/components/ui/PageShell.tsx
import React from "react";
import { cn } from "@/lib/cn";
import { getActiveTheme } from "@/lib/theme-server";

type Props = {
  children: React.ReactNode;
  maxWidth?: "md" | "xl" | "6xl" | "7xl";
};

const maxWidthMap = {
  md: "max-w-md",
  xl: "max-w-xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

export default function PageShell({
  children,
  maxWidth = "6xl",
}: Props) {
  const theme = getActiveTheme();

  return (
    <main className={cn("relative min-h-[100svh] overflow-hidden text-zinc-100", theme.page.bg)}>
      <div className="absolute inset-0">
        <div className={cn("absolute inset-0", theme.page.radial)} />
        <div className={cn("absolute inset-0", theme.page.grid)} />
      </div>

      <div
        className={cn(
          "relative z-10 mx-auto px-4 py-5 sm:px-6 sm:py-8",
          maxWidthMap[maxWidth]
        )}
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        {children}
      </div>
    </main>
  );
}
