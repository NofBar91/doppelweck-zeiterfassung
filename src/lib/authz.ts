import type { Session } from "next-auth";

export function isAdmin(session: Session | null): boolean {
  return !!session && session.user?.role === "ADMIN";
}

export function canEditEntry(session: Session | null, userIdOfEntry: string): boolean {
  if (!session) return false;
  if (isAdmin(session)) return true;
  return session.user?.id === userIdOfEntry;
}
