export interface Theme {
  id: string;
  name: string;
  light?: boolean;
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  editorBg: string;
}

export const themes: Theme[] = [
  {
    id: "midnight",
    name: "Midnight",
    bg: "#06080d",
    surface: "#0a0d14",
    surfaceHover: "#10141d",
    border: "rgba(255,255,255,0.06)",
    textPrimary: "#e8eaed",
    textSecondary: "#9aa5b4",
    textMuted: "#4a5568",
    editorBg: "#080a0f",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    bg: "#0b0b0f",
    surface: "#101014",
    surfaceHover: "#18181f",
    border: "rgba(255,255,255,0.07)",
    textPrimary: "#e4e4e7",
    textSecondary: "#a1a1aa",
    textMuted: "#52525b",
    editorBg: "#0b0b0f",
  },
  {
    id: "ocean",
    name: "Ocean",
    bg: "#04101a",
    surface: "#081824",
    surfaceHover: "#0d2030",
    border: "rgba(100,180,255,0.08)",
    textPrimary: "#d6e8f0",
    textSecondary: "#7aa8c4",
    textMuted: "#3a6080",
    editorBg: "#04101a",
  },
  {
    id: "forest",
    name: "Forest",
    bg: "#060d08",
    surface: "#0a140c",
    surfaceHover: "#111e14",
    border: "rgba(100,220,140,0.07)",
    textPrimary: "#d4e8d8",
    textSecondary: "#7aac88",
    textMuted: "#3a6848",
    editorBg: "#060d08",
  },
  {
    id: "warm",
    name: "Warm Night",
    bg: "#0d0908",
    surface: "#14100e",
    surfaceHover: "#1e1816",
    border: "rgba(255,180,120,0.07)",
    textPrimary: "#ede4dc",
    textSecondary: "#b8a090",
    textMuted: "#685848",
    editorBg: "#0d0908",
  },
  {
    id: "nord",
    name: "Nord",
    bg: "#1a1e26",
    surface: "#222830",
    surfaceHover: "#2a3040",
    border: "rgba(136,192,208,0.1)",
    textPrimary: "#d8dee9",
    textSecondary: "#7b88a1",
    textMuted: "#4c566a",
    editorBg: "#1a1e26",
  },
  {
    id: "snow",
    name: "Snow",
    light: true,
    bg: "#ffffff",
    surface: "#f8f9fa",
    surfaceHover: "#f0f1f3",
    border: "rgba(0,0,0,0.08)",
    textPrimary: "#1a1a2e",
    textSecondary: "#5a5a72",
    textMuted: "#9a9ab0",
    editorBg: "#ffffff",
  },
  {
    id: "paper",
    name: "Paper",
    light: true,
    bg: "#faf8f5",
    surface: "#f2efe9",
    surfaceHover: "#eae6de",
    border: "rgba(120,100,70,0.12)",
    textPrimary: "#2c2416",
    textSecondary: "#6b5d4a",
    textMuted: "#a09580",
    editorBg: "#faf8f5",
  },
  {
    id: "daylight",
    name: "Daylight",
    light: true,
    bg: "#f0f4ff",
    surface: "#e4eaf8",
    surfaceHover: "#d8e0f0",
    border: "rgba(60,80,160,0.1)",
    textPrimary: "#1a2040",
    textSecondary: "#4a5580",
    textMuted: "#8890b0",
    editorBg: "#f0f4ff",
  },
  {
    id: "sage",
    name: "Sage",
    light: true,
    bg: "#f2f5f0",
    surface: "#e8ece4",
    surfaceHover: "#dce2d6",
    border: "rgba(60,100,60,0.1)",
    textPrimary: "#1a2818",
    textSecondary: "#4a6048",
    textMuted: "#88a085",
    editorBg: "#f2f5f0",
  },
  {
    id: "rose-light",
    name: "Rosé",
    light: true,
    bg: "#fdf2f4",
    surface: "#f8e8eb",
    surfaceHover: "#f0dce0",
    border: "rgba(160,60,80,0.08)",
    textPrimary: "#2e1418",
    textSecondary: "#7a4050",
    textMuted: "#b08898",
    editorBg: "#fdf2f4",
  },
];

export interface AccentColor {
  id: string;
  name: string;
  color: string;
  hover: string;
  glow: string;
}

export const accentColors: AccentColor[] = [
  { id: "violet", name: "Violet", color: "#8b5cf6", hover: "#a78bfa", glow: "rgba(139,92,246,0.2)" },
  { id: "blue", name: "Blue", color: "#3b82f6", hover: "#60a5fa", glow: "rgba(59,130,246,0.2)" },
  { id: "cyan", name: "Cyan", color: "#06b6d4", hover: "#22d3ee", glow: "rgba(6,182,212,0.2)" },
  { id: "emerald", name: "Emerald", color: "#10b981", hover: "#34d399", glow: "rgba(16,185,129,0.2)" },
  { id: "amber", name: "Amber", color: "#f59e0b", hover: "#fbbf24", glow: "rgba(245,158,11,0.2)" },
  { id: "rose", name: "Rose", color: "#f43f5e", hover: "#fb7185", glow: "rgba(244,63,94,0.2)" },
  { id: "orange", name: "Orange", color: "#f97316", hover: "#fb923c", glow: "rgba(249,115,22,0.2)" },
  { id: "pink", name: "Pink", color: "#ec4899", hover: "#f472b6", glow: "rgba(236,72,153,0.2)" },
];

export function applyTheme(theme: Theme, accent: AccentColor) {
  const root = document.documentElement;
  root.style.setProperty("--color-bg", theme.bg);
  root.style.setProperty("--color-surface", theme.surface);
  root.style.setProperty("--color-surface-hover", theme.surfaceHover);
  root.style.setProperty("--color-border", theme.border);
  root.style.setProperty("--color-text-primary", theme.textPrimary);
  root.style.setProperty("--color-text-secondary", theme.textSecondary);
  root.style.setProperty("--color-text-muted", theme.textMuted);
  root.style.setProperty("--gitem-editor-bg", theme.editorBg);
  root.style.setProperty("--color-accent", accent.color);
  root.style.setProperty("--color-accent-hover", accent.hover);
  root.style.setProperty("--color-accent-glow", accent.glow);

  if (theme.light) {
    root.setAttribute("data-theme", "light");
    root.style.setProperty("--gitem-hover", "rgba(0,0,0,0.04)");
    root.style.setProperty("--gitem-hover-strong", "rgba(0,0,0,0.07)");
    root.style.setProperty("--gitem-overlay", "rgba(0,0,0,0.5)");
    root.style.setProperty("--gitem-panel", theme.surface);
    root.style.setProperty("--gitem-scrollbar", "rgba(0,0,0,0.1)");
    root.style.setProperty("--gitem-scrollbar-hover", "rgba(0,0,0,0.2)");
  } else {
    root.setAttribute("data-theme", "dark");
    root.style.setProperty("--gitem-hover", "rgba(255,255,255,0.04)");
    root.style.setProperty("--gitem-hover-strong", "rgba(255,255,255,0.07)");
    root.style.setProperty("--gitem-overlay", "rgba(0,0,0,0.6)");
    root.style.setProperty("--gitem-panel", "#141820");
    root.style.setProperty("--gitem-scrollbar", "rgba(255,255,255,0.06)");
    root.style.setProperty("--gitem-scrollbar-hover", "rgba(255,255,255,0.12)");
  }
}

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) ?? themes[0];
}

export function getAccent(id: string): AccentColor {
  return accentColors.find((a) => a.id === id) ?? accentColors[0];
}
