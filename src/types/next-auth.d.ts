import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EMPLOYEE";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
    role: "ADMIN" | "EMPLOYEE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "EMPLOYEE";
  }
}
