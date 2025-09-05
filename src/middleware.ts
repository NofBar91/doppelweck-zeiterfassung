import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  // Nur echte, geschützte Seiten – NICHT /login, NICHT /api/auth
  matcher: [
    "/dashboard",
    "/admin/:path*",
    // wenn du API-Routen schützen willst, nimm nur deine eigenen:
    "/api/time-entries/:path*",
    "/api/admin/:path*",
  ],
};
