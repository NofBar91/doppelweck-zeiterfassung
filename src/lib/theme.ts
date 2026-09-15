// src/lib/theme.ts
export type ThemeName = "standard" | "easter" | "christmas";

export type AppTheme = {
  name: ThemeName;
  labels: {
    admin: string;
    dashboard: string;
    timeEntries: string;
  };
  page: {
    bg: string;
    radial: string;
    grid: string;
  };
  surface: {
    card: string;
    softCard: string;
    modal: string;
    glowTop: string;
    glowBottom: string;
    overlay: string;
  };
  badge: {
    base: string;
  };
  button: {
    primary: string;
    secondary: string;
    danger: string;
    success: string;
    warning: string;
  };
  input: {
    base: string;
    focus: string;
  };
  status: {
    draft: string;
    submitted: string;
    approved: string;
    rejected: string;
  };
};

const standard: AppTheme = {
  name: "standard",
  labels: { admin: "Verwaltung", dashboard: "Fahrerbereich", timeEntries: "Deine Touren" },
  page: { bg: "bg-background", radial: "", grid: "" },
  surface: {
    card: "border border-stone-200 bg-white shadow-sm",
    softCard: "border border-stone-200 bg-white",
    modal: "border border-stone-200 bg-white shadow-xl",
    glowTop: "hidden", glowBottom: "hidden", overlay: "hidden",
  },
  badge: { base: "border border-stone-200 bg-stone-100 text-stone-700" },
  button: {
    primary: "dw-primary",
    secondary: "dw-secondary",
    danger: "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
    success: "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    warning: "border border-amber-200 bg-amber-50 text-amber-900",
  },
  input: { base: "dw-input", focus: "focus:border-stone-500 focus:ring-2 focus:ring-stone-200" },
  status: {
    draft: "border-stone-200 bg-stone-100 text-stone-600",
    submitted: "border-amber-200 bg-amber-50 text-amber-900",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
    rejected: "border-red-200 bg-red-50 text-red-800",
  },
};
// Retain configured theme names while keeping a consistent, calm work interface.
export const themes: Record<ThemeName, AppTheme> = {
  standard,
  easter: { ...standard, name: "easter" },
  christmas: { ...standard, name: "christmas" },
};
