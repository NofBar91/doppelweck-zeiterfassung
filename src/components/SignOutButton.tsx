"use client";

import { signOut } from "next-auth/react";
import { getThemeClasses } from "@/lib/theme-classes";
import { cn } from "@/lib/cn";

export default function SignOutButton() {
  const theme = getThemeClasses();

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition",
        theme.button.secondary
      )}
    >
      Abmelden
    </button>
  );
}
