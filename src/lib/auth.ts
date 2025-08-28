import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";
import type { Role } from "@prisma/client";

type UserWithRole = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
};

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" }
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const u: UserWithRole = {
          id: user.id,
          name: user.name ?? null,
          email: user.email,
          role: user.role,
        };
        return u as unknown as NextAuthUser; // kein any
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        const r = (user as unknown as Partial<UserWithRole>).role;
        if (r) {
          (token as JWT & { role?: Role }).role = r;
        }
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (session.user) {
        session.user.id = token.sub ?? "";
        const r = (token as JWT & { role?: Role }).role;
        // ts-expect-error custom Feld auf user
        session.user.role = r ?? "EMPLOYEE";
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};
