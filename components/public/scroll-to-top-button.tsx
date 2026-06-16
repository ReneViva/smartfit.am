"use client";

import { useEffect, useState } from "react";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setVisible(window.scrollY > 520);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <button
      aria-label="Scroll to top"
      className={`fixed bottom-5 right-5 z-40 inline-flex size-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-[opacity,transform,background-color,border-color,color] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
      onClick={() => window.scrollTo({ behavior: "smooth", top: 0 })}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="size-5 fill-none stroke-current stroke-2"
        viewBox="0 0 24 24"
      >
        <path d="m6 14 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
