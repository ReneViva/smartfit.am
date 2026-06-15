"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "smartfit-public-theme";

function applyTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    const preferredTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    setTheme(preferredTheme);
    applyTheme(preferredTheme);
    setReady(true);
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      aria-label={`Switch to ${nextTheme} theme`}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      onClick={() => {
        setTheme(nextTheme);
        applyTheme(nextTheme);
        window.localStorage.setItem(THEME_KEY, nextTheme);
      }}
      title={`Switch to ${nextTheme} theme`}
      type="button"
    >
      <span className="sr-only">
        {ready ? `Current theme: ${theme}` : "Choose theme"}
      </span>
      {theme === "dark" ? (
        <svg
          aria-hidden="true"
          className="size-5 fill-none stroke-current stroke-2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="size-5 fill-current stroke-current stroke-1.5"
          viewBox="0 0 24 24"
        >
          <path d="M20.5 15.2A8.8 8.8 0 0 1 8.8 3.5 8.8 8.8 0 1 0 20.5 15.2Z" />
        </svg>
      )}
    </button>
  );
}
