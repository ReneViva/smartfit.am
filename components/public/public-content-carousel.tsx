"use client";

import { useCallback, useEffect, useState } from "react";

import { PublicContentImage } from "./public-content-image";

type PublicContentItem = {
  body: string | null;
  id: string;
  imageUrl: string | null;
  title: string;
  type: string;
};

const ROTATION_INTERVAL_MS = 5000;

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className="size-5 fill-none stroke-current stroke-2"
      viewBox="0 0 24 24"
    >
      <path
        d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PublicContentCarousel({
  items,
}: {
  items: PublicContentItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const hasMultipleItems = items.length > 1;

  const showItem = useCallback(
    (index: number) => {
      setActiveIndex((index + items.length) % items.length);
    },
    [items.length],
  );

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % items.length);
  }, [items.length]);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!hasMultipleItems || paused || prefersReducedMotion) {
      return;
    }

    const timer = window.setTimeout(showNext, ROTATION_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex, hasMultipleItems, paused, prefersReducedMotion, showNext]);

  if (!items.length) {
    return null;
  }

  const activeItem = items[activeIndex] ?? items[0];

  return (
    <div
      aria-label="Active offers and announcements"
      aria-roledescription="carousel"
      className="mt-6"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
      onFocusCapture={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
    >
      <article
        aria-label={`Offer ${activeIndex + 1} of ${items.length}`}
        aria-roledescription="slide"
        className={`offer-feature-card public-content-carousel-slide overflow-hidden rounded-2xl border border-brand bg-card ${
          activeItem.imageUrl
            ? "grid lg:min-h-[25rem] lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]"
            : "offer-feature-card--text-only"
        }`}
        key={activeItem.id}
        role="group"
      >
        <div
          className={`flex min-h-72 flex-col justify-center bg-soft-blue px-6 py-8 sm:px-10 sm:py-12 ${
            activeItem.imageUrl
              ? ""
              : `items-start lg:min-h-[25rem] lg:px-14 lg:py-14 ${
                  hasMultipleItems
                    ? "min-h-[34rem] sm:min-h-[38rem]"
                    : ""
                }`
          }`}
        >
          <p className="w-fit rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white">
            {activeItem.type.toLowerCase().replaceAll("_", " ")}
          </p>
          <h3
            className={`mt-5 text-3xl font-bold leading-tight text-foreground sm:text-5xl ${
              activeItem.imageUrl ? "max-w-3xl" : "max-w-4xl"
            }`}
          >
            {activeItem.title}
          </h3>
          {activeItem.body ? (
            <p
              className={`mt-5 text-base leading-7 text-secondary sm:text-lg ${
                activeItem.imageUrl ? "max-w-3xl" : "max-w-4xl"
              }`}
            >
              {activeItem.body}
            </p>
          ) : null}
        </div>

        {activeItem.imageUrl ? (
          <div className="offer-feature-media min-h-64 overflow-hidden bg-soft-blue sm:min-h-80 lg:min-h-0">
            <PublicContentImage
              alt={activeItem.title}
              className="h-64 w-full sm:h-80 lg:h-full lg:min-h-[25rem]"
              eager
              src={activeItem.imageUrl}
            />
          </div>
        ) : null}
      </article>

      {hasMultipleItems ? (
        <div className="mt-4 flex items-center justify-between gap-4">
          <button
            aria-label="Previous offer"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-[background-color,border-color,color,transform] hover:border-brand hover:bg-soft-blue hover:text-primary-active active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={showPrevious}
            type="button"
          >
            <ArrowIcon direction="left" />
          </button>

          <div
            aria-label="Choose offer"
            className="flex min-h-11 flex-wrap items-center justify-center gap-2"
            role="group"
          >
            {items.map((item, index) => (
              <button
                aria-label={`Go to offer ${index + 1}`}
                aria-pressed={index === activeIndex}
                className={`size-3 rounded-full border transition-[background-color,border-color,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  index === activeIndex
                    ? "scale-110 border-brand bg-brand"
                    : "border-input-border bg-card hover:border-brand hover:bg-soft-blue"
                }`}
                key={item.id}
                onClick={() => showItem(index)}
                type="button"
              />
            ))}
          </div>

          <button
            aria-label="Next offer"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-[background-color,border-color,color,transform] hover:border-brand hover:bg-soft-blue hover:text-primary-active active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={showNext}
            type="button"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
