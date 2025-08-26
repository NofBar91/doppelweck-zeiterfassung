export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard",
    "/admin/:path*",
    // später: "/api/time-entries/:path*" wenn du API schützen willst
  ],
};
