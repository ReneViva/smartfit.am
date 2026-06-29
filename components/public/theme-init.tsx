"use client";

import { useEffect } from "react";

import { THEME_STORAGE_KEY } from "../../lib/theme";
import { getPreferredClientTheme, persistTheme } from "./theme-client";

export function ThemeInit() {
  useEffect(() => {
    persistTheme(getPreferredClientTheme());

    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY) {
        persistTheme(getPreferredClientTheme());
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return null;
}
