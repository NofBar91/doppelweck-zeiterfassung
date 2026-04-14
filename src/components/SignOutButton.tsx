"use client";

import { signOut } from "next-auth/react";
import { getThemeClasses } from "@/lib/theme-classes";
import { cn } from "@/lib/cn";

export default function SignOutButton() {
  const theme = getThemeClasses();

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium transition",
        theme.button.secondary
      )}
    >
      Abmelden
    </button>
  );
}
