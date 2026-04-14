// src/lib/theme-classes.ts
import { themes } from "./theme";
import { getActiveThemeName } from "./theme-server";

export function getThemeClasses() {
  return themes[getActiveThemeName()];
}
