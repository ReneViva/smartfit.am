"use client";

import { useEffect, useState } from "react";

import type { ThemeMode } from "../../lib/theme";
import { getPreferredClientTheme, persistTheme } from "./theme-client";

export function ThemeToggle({
  variant = "default",
}: {
  variant?: "default" | "onHero";
}) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const preferredTheme = getPreferredClientTheme();

    setTheme(preferredTheme);
    persistTheme(preferredTheme);
    setReady(true);
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";
  const buttonClassName =
    variant === "onHero"
      ? "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-sm backdrop-blur transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-white/65 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      : "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  return (
    <button
      aria-label={`Switch to ${nextTheme} theme`}
      className={buttonClassName}
      onClick={() => {
        setTheme(nextTheme);
        persistTheme(nextTheme);
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
