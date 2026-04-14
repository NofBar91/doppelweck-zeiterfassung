// src/components/ui/buttons.tsx
import React from "react";
import { cn } from "@/lib/cn";
import { getActiveTheme } from "@/lib/theme-server";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonProps) {
  const theme = getActiveTheme();

  return (
    <button
      {...props}
      className={cn(
        "rounded-2xl px-4 py-3 font-semibold transition hover:scale-[1.02] disabled:opacity-70",
        theme.button.primary,
        className
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: ButtonProps) {
  const theme = getActiveTheme();

  return (
    <button
      {...props}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-medium transition",
        theme.button.secondary,
        className
      )}
    >
      {children}
    </button>
  );
}
