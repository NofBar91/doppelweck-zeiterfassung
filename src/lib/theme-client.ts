// src/lib/theme-client.ts
import { themes, type AppTheme } from "./theme";
import { getActiveThemeName } from "./theme-server";

export function getClientTheme(): AppTheme {
  return themes[getActiveThemeName()];
}
