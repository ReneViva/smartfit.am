import {
  normalizeTheme,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "../../lib/theme";

const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getCookieTheme() {
  if (typeof document === "undefined") {
    return null;
  }

  const themeCookie = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${THEME_COOKIE_NAME}=`));

  if (!themeCookie) {
    return null;
  }

  return normalizeTheme(themeCookie.split("=").slice(1).join("="));
}

function getLocalStorageTheme() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

function getDomTheme() {
  if (typeof document === "undefined") {
    return null;
  }

  return normalizeTheme(document.documentElement.dataset.theme);
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function getPreferredClientTheme() {
  return getLocalStorageTheme() ?? getCookieTheme() ?? getDomTheme() ?? "light";
}

export function persistTheme(theme: ThemeMode) {
  applyTheme(theme);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in restricted browser modes.
  }

  document.cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}
