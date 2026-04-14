// src/lib/theme-server.ts
import { themes, type AppTheme, type ThemeName } from "./theme";

export function getActiveThemeName(): ThemeName {
  const raw = process.env.NEXT_PUBLIC_APP_THEME?.toLowerCase();

  if (raw === "easter") return "easter";
  if (raw === "christmas") return "christmas";
  return "standard";
}

export function getActiveTheme(): AppTheme {
  return themes[getActiveThemeName()];
}
