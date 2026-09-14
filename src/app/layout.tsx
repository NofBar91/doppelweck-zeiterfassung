import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Doppelweck · Fahrer-Zeiterfassung", template: "%s · Doppelweck" },
  description: "Arbeitszeiten und Touren für das Fahrerteam von Doppelweck erfassen und verwalten.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/brand-icon.svg", apple: "/icons/icon-192.png" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#825331", viewportFit: "cover" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
