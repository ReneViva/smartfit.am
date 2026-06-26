"use client";

import { useEffect } from "react";

const THEME_KEY = "smartfit-public-theme";

function applyTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeInit() {
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    const theme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    applyTheme(theme);
  }, []);

  return null;
}
