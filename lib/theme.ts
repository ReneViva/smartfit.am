export type ThemeMode = "dark" | "light";

export const THEME_COOKIE_NAME = "smartfit_theme";
export const THEME_STORAGE_KEY = "smartfit-public-theme";

export function normalizeTheme(value: string | null | undefined): ThemeMode | null {
  return value === "dark" || value === "light" ? value : null;
}
