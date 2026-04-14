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

export const themes: Record<ThemeName, AppTheme> = {
  standard: {
    name: "standard",
    labels: {
      admin: "Admin-Bereich",
      dashboard: "Dashboard",
      timeEntries: "Arbeitszeiten",
    },
    page: {
      bg: "bg-[#14110f]",
      radial:
        "bg-[radial-gradient(circle_at_top,rgba(245,222,179,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(120,72,32,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.12),transparent_30%)]",
      grid: "bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:34px_34px] opacity-[0.04]",
    },
    surface: {
      card: "border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl",
      softCard: "border border-white/10 bg-white/[0.04] backdrop-blur-sm",
      modal: "border border-white/10 bg-[#181310] shadow-2xl",
      glowTop: "bg-amber-200/10",
      glowBottom: "bg-orange-400/10",
      overlay:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%,rgba(255,248,240,0.02))]",
    },
    badge: {
      base: "border border-amber-200/20 bg-amber-100/10 text-amber-100",
    },
    button: {
      primary:
        "bg-gradient-to-r from-amber-200/90 via-orange-200/90 to-amber-100/90 text-zinc-900 shadow-[0_10px_40px_rgba(217,119,6,0.20)]",
      secondary:
        "border border-white/10 bg-white/10 text-white hover:bg-white/15",
      danger: "border border-red-400/20 bg-red-400/10 text-red-200",
      success: "border border-orange-300/20 bg-orange-300/10 text-orange-200",
      warning: "border border-amber-200/20 bg-amber-100/10 text-amber-100",
    },
    input: {
      base: "border border-white/10 bg-black/20 text-white placeholder:text-zinc-500 outline-none",
      focus: "focus:border-amber-300/40 focus:ring-2 focus:ring-amber-100/10",
    },
    status: {
      draft: "border-white/10 bg-white/5 text-zinc-300",
      submitted: "border-amber-200/20 bg-amber-100/10 text-amber-100",
      approved: "border-orange-300/20 bg-orange-300/10 text-orange-200",
      rejected: "border-red-400/20 bg-red-400/10 text-red-200",
    },
  },

  easter: {
    name: "easter",
    labels: {
      admin: "Oster-Admin",
      dashboard: "Frühlings-Dashboard",
      timeEntries: "Frühlingszeiten",
    },
    page: {
      bg: "bg-[#0b0b0f]",
      radial:
        "bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%)]",
      grid: "bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:34px_34px] opacity-[0.05]",
    },
    surface: {
      card: "border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl",
      softCard: "border border-white/10 bg-white/[0.04] backdrop-blur-sm",
      modal: "border border-white/10 bg-[#111118] shadow-2xl",
      glowTop: "bg-amber-300/10",
      glowBottom: "bg-pink-300/10",
      overlay:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%,rgba(255,255,255,0.02))]",
    },
    badge: {
      base: "border border-amber-300/20 bg-amber-300/10 text-amber-200",
    },
    button: {
      primary:
        "bg-gradient-to-r from-amber-300/90 via-amber-200/90 to-pink-200/90 text-zinc-950 shadow-[0_10px_40px_rgba(251,191,36,0.22)]",
      secondary:
        "border border-white/10 bg-white/10 text-white hover:bg-white/15",
      danger: "border border-red-400/20 bg-red-400/10 text-red-200",
      success: "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
      warning: "border border-amber-300/20 bg-amber-300/10 text-amber-200",
    },
    input: {
      base: "border border-white/10 bg-black/20 text-white placeholder:text-zinc-500 outline-none",
      focus: "focus:border-amber-300/40 focus:ring-2 focus:ring-amber-200/10",
    },
    status: {
      draft: "border-white/10 bg-white/5 text-zinc-300",
      submitted: "border-amber-300/20 bg-amber-300/10 text-amber-200",
      approved: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
      rejected: "border-red-400/20 bg-red-400/10 text-red-200",
    },
  },

  christmas: {
    name: "christmas",
    labels: {
      admin: "Weihnachts-Admin",
      dashboard: "Winter-Dashboard",
      timeEntries: "Winterzeiten",
    },
    page: {
      bg: "bg-[#101412]",
      radial:
        "bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(185,28,28,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_30%)]",
      grid: "bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:34px_34px] opacity-[0.04]",
    },
    surface: {
      card: "border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl",
      softCard: "border border-white/10 bg-white/[0.04] backdrop-blur-sm",
      modal: "border border-white/10 bg-[#121816] shadow-2xl",
      glowTop: "bg-red-300/10",
      glowBottom: "bg-emerald-300/10",
      overlay:
        "bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%,rgba(240,255,244,0.02))]",
    },
    badge: {
      base: "border border-red-300/20 bg-red-300/10 text-red-100",
    },
    button: {
      primary:
        "bg-gradient-to-r from-red-300/90 via-emerald-200/90 to-amber-100/90 text-zinc-950 shadow-[0_10px_40px_rgba(185,28,28,0.20)]",
      secondary:
        "border border-white/10 bg-white/10 text-white hover:bg-white/15",
      danger: "border border-red-400/20 bg-red-400/10 text-red-200",
      success: "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
      warning: "border border-amber-300/20 bg-amber-300/10 text-amber-200",
    },
    input: {
      base: "border border-white/10 bg-black/20 text-white placeholder:text-zinc-500 outline-none",
      focus: "focus:border-red-300/40 focus:ring-2 focus:ring-red-200/10",
    },
    status: {
      draft: "border-white/10 bg-white/5 text-zinc-300",
      submitted: "border-amber-300/20 bg-amber-300/10 text-amber-200",
      approved: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
      rejected: "border-red-400/20 bg-red-400/10 text-red-200",
    },
  },
};
