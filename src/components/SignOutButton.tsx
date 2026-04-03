"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
    >
      Abmelden
    </button>
  );
}
