import type { ReactNode } from "react";
export default function PageShell({ children, maxWidth = "6xl" }: { children: ReactNode; maxWidth?: "md" | "xl" | "6xl" | "7xl" }) {
  const widths = { md: "max-w-md", xl: "max-w-xl", "6xl": "max-w-6xl", "7xl": "max-w-7xl" };
  return <main id="main-content" className={`mx-auto w-full ${widths[maxWidth]} px-4 py-7 sm:px-8 sm:py-10`} style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>{children}</main>;
}
