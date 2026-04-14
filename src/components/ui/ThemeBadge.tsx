// src/components/ui/ThemeBadge.tsx
import React from "react";
import { cn } from "@/lib/cn";
import { getActiveTheme } from "@/lib/theme-server";

export default function ThemeBadge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const theme = getActiveTheme();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        theme.badge.base,
        className
      )}
    >
      {children}
    </span>
  );
}
