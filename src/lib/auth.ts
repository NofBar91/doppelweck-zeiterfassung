import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" }
      },
      async authorize(credentials) {
        const creds = credentials as { email?: string; password?: string } | null;
        const email = creds?.email?.toLowerCase().trim();
        const password = creds?.password ?? "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role } as unknown as any;
        // Hinweis: Die `role` kommt unten über callbacks in die Session
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user && "role" in user) {
        // ts-expect-error – wir erweitern das Token um role
        token.role = (user as { role: "ADMIN" | "EMPLOYEE" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      // session.user.id ist bei Credentials nicht automatisch gesetzt → aus token.sub
      if (session.user) {
        session.user.id = token.sub ?? "";
        // ts-expect-error – custom Feld
        session.user.role = (token as unknown as { role?: "ADMIN" | "EMPLOYEE" }).role ?? "EMPLOYEE";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
