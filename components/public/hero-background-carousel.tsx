"use client";

import { useEffect, useState } from "react";

export type HeroBackgroundImage = {
  position?: string;
  src: string;
};

const HERO_ROTATION_INTERVAL_MS = 6200;

export function HeroBackgroundCarousel({
  images,
}: {
  images: ReadonlyArray<HeroBackgroundImage>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, images.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!hasMultipleImages || prefersReducedMotion) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, HERO_ROTATION_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex, hasMultipleImages, images.length, prefersReducedMotion]);

  if (!images.length) {
    return null;
  }

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0">
        {images.map((image, index) => (
          <div
            className={`absolute inset-0 bg-cover transition-opacity duration-[1400ms] ease-out motion-reduce:transition-none ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            key={image.src}
            style={{
              backgroundImage: `url("${image.src}")`,
              backgroundPosition: image.position ?? "center",
            }}
          />
        ))}
      </div>

      {hasMultipleImages ? (
        <div
          aria-hidden="true"
          className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2"
        >
          {images.map((image, index) => (
            <span
              className={`h-1.5 rounded-full transition-[background-color,width] duration-500 motion-reduce:transition-none ${
                index === activeIndex
                  ? "w-10 bg-brand"
                  : "w-4 bg-white/35"
              }`}
              key={image.src}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
