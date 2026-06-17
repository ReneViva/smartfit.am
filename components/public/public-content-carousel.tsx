"use client";

import type { CSSProperties, KeyboardEvent, UIEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PublicContentImage } from "./public-content-image";

type PublicContentItem = {
  body: string | null;
  id: string;
  imageUrl: string | null;
  title: string;
  type: string;
};

const ROTATION_INTERVAL_MS = 6500;

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

function fallbackSlides(gymName: string): PublicContentItem[] {
  return [
    {
      body: "Fresh offers and announcements will appear here as soon as they are active.",
      id: "smartfit-fallback-offers",
      imageUrl: null,
      title: `${gymName} training starts here`,
      type: "OFFER",
    },
    {
      body: "Explore active packages, services, and training options built for steady progress.",
      id: "smartfit-fallback-packages",
      imageUrl: null,
      title: "Find the package that fits your routine",
      type: "PACKAGE",
    },
    {
      body: "Check live occupancy before visiting and keep the gym close from your phone.",
      id: "smartfit-fallback-occupancy",
      imageUrl: null,
      title: "Know the crowd before you go",
      type: "OUR_APP",
    },
  ];
}

function displayType(type: string) {
  return type.toLowerCase().replaceAll("_", " ");
}

function normalizedOffset(index: number, activeIndex: number, length: number) {
  let offset = index - activeIndex;

  if (offset > length / 2) {
    offset -= length;
  } else if (offset < -length / 2) {
    offset += length;
  }

  return offset;
}

function slideStyle(
  offset: number,
  prefersReducedMotion: boolean,
): CSSProperties {
  if (prefersReducedMotion || offset === 0) {
    return {
      opacity: offset === 0 ? 1 : 0,
      transform: "translate3d(-50%, 0, 0) rotateY(0deg) scale(1)",
      zIndex: offset === 0 ? 30 : 0,
    };
  }

  const sideOffsetRem = offset * 26;
  const rotate = offset * -16;

  return {
    opacity: Math.abs(offset) === 1 ? 0.7 : 0,
    transform: `translate3d(calc(-50% + ${sideOffsetRem}rem), 1.7rem, -170px) rotateY(${rotate}deg) scale(0.84)`,
    zIndex: Math.abs(offset) === 1 ? 20 : 0,
  };
}

function FallbackVisual({
  compact = false,
  title,
}: {
  compact?: boolean;
  title: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border-t border-white/15 bg-brand text-white lg:min-h-full lg:border-l lg:border-t-0 ${
        compact ? "min-h-44 px-5 py-6" : "min-h-64 px-8 py-10"
      }`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/35 to-brand/75"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-10 top-10 h-px bg-white/25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-10 bottom-10 h-px bg-white/25"
      />
      <div className="relative grid w-full max-w-sm gap-4">
        <div
          className={`mx-auto flex items-center justify-center rounded-lg border border-white/20 bg-white shadow-xl ${
            compact ? "size-24 p-5" : "size-32 p-6 sm:size-40"
          }`}
        >
          <img alt="" className="max-h-full max-w-full" src="/logo/S.svg" />
        </div>
        <div className="rounded-lg border border-white/20 bg-black/35 px-5 py-4 text-center shadow-sm backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
            Smartfit.am
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-white">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PublicContentCarousel({
  gymName,
  items,
}: {
  gymName: string;
  items: PublicContentItem[];
}) {
  const slides = useMemo(
    () => (items.length ? items : fallbackSlides(gymName)),
    [gymName, items],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [disableAutoplay, setDisableAutoplay] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const mobileScrollerRef = useRef<HTMLDivElement | null>(null);
  const mobileSlideRefs = useRef<Array<HTMLElement | null>>([]);
  const hasMultipleItems = slides.length > 1;

  const scrollMobileSlideToIndex = useCallback((index: number) => {
    const scroller = mobileScrollerRef.current;
    const slide = mobileSlideRefs.current[index];

    if (
      !scroller ||
      !slide ||
      !window.matchMedia("(max-width: 767px)").matches
    ) {
      return;
    }

    const centeredLeft =
      slide.offsetLeft - (scroller.clientWidth - slide.offsetWidth) / 2;
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;

    scroller.scrollTo({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      left: Math.min(Math.max(centeredLeft, 0), maxScrollLeft),
    });
  }, [prefersReducedMotion]);

  const showItem = useCallback(
    (index: number) => {
      const nextIndex = (index + slides.length) % slides.length;

      setActiveIndex(nextIndex);
      window.requestAnimationFrame(() => scrollMobileSlideToIndex(nextIndex));
    },
    [scrollMobileSlideToIndex, slides.length],
  );

  const showNext = useCallback(
    ({ scrollMobile = true }: { scrollMobile?: boolean } = {}) => {
      setActiveIndex((current) => {
        const nextIndex = (current + 1) % slides.length;

        if (scrollMobile) {
          window.requestAnimationFrame(() =>
            scrollMobileSlideToIndex(nextIndex),
          );
        }

        return nextIndex;
      });
    },
    [scrollMobileSlideToIndex, slides.length],
  );

  const showPrevious = useCallback(
    ({ scrollMobile = true }: { scrollMobile?: boolean } = {}) => {
      setActiveIndex((current) => {
        const nextIndex = (current - 1 + slides.length) % slides.length;

        if (scrollMobile) {
          window.requestAnimationFrame(() =>
            scrollMobileSlideToIndex(nextIndex),
          );
        }

        return nextIndex;
      });
    },
    [scrollMobileSlideToIndex, slides.length],
  );

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, slides.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const updatePreference = () => setDisableAutoplay(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!hasMultipleItems || paused || prefersReducedMotion || disableAutoplay) {
      return;
    }

    const timer = window.setTimeout(
      () => showNext({ scrollMobile: false }),
      ROTATION_INTERVAL_MS,
    );

    return () => window.clearTimeout(timer);
  }, [
    activeIndex,
    disableAutoplay,
    hasMultipleItems,
    paused,
    prefersReducedMotion,
    showNext,
  ]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasMultipleItems) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  }

  function handleMobileScroll(event: UIEvent<HTMLDivElement>) {
    const scroller = event.currentTarget;
    const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    let closestIndex = activeIndex;
    let closestDistance = Number.POSITIVE_INFINITY;

    mobileSlideRefs.current.forEach((slide, index) => {
      if (!slide) {
        return;
      }

      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(scrollerCenter - slideCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  }

  return (
    <div
      aria-label="Active offers and announcements"
      aria-roledescription="carousel"
      className="relative w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:overflow-visible"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
      onFocusCapture={() => setPaused(true)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      tabIndex={0}
    >
      <div className="relative">
        <div
          className="home-scroll-snap flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 md:hidden"
          onScroll={handleMobileScroll}
          ref={mobileScrollerRef}
        >
          {slides.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <article
                aria-label={`Offer ${index + 1} of ${slides.length}`}
                aria-roledescription="slide"
                className="grid w-[86vw] max-w-[23rem] shrink-0 snap-center overflow-hidden rounded-lg border border-white/15 bg-card text-left shadow-xl shadow-black/30"
                key={item.id}
                ref={(element) => {
                  mobileSlideRefs.current[index] = element;
                }}
                role="group"
              >
                {item.imageUrl ? (
                  <div className="h-44 overflow-hidden border-b border-border bg-soft-blue">
                    <PublicContentImage
                      alt={item.title}
                      className="h-full w-full"
                      eager={isActive}
                      src={item.imageUrl}
                    />
                  </div>
                ) : (
                  <FallbackVisual compact title={item.title} />
                )}

                <div className="flex min-h-56 flex-col justify-center px-4 py-5">
                  <p className="w-fit rounded-full bg-brand px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white">
                    {displayType(item.type)}
                  </p>
                  <h3 className="mt-4 line-clamp-3 text-xl font-bold leading-tight text-foreground">
                    {item.title}
                  </h3>
                  {item.body ? (
                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-secondary">
                      {item.body}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-secondary">
                      More details will be available soon.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="relative hidden min-h-[36rem] overflow-visible [perspective:1800px] md:block lg:min-h-[38rem]">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-8 h-[30rem] w-[min(90vw,78rem)] -translate-x-1/2 rotate-[-2.5deg] rounded-lg border border-white/10 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-sm"
          />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-14 h-[27rem] w-[min(82vw,68rem)] -translate-x-1/2 rotate-[2deg] rounded-lg border border-brand/25 bg-brand/20 shadow-2xl shadow-brand/10"
          />
          {slides.map((item, index) => {
            const offset = normalizedOffset(index, activeIndex, slides.length);
            const isActive = offset === 0;
            const visible =
              Math.abs(offset) <= 1 && (!prefersReducedMotion || isActive);

            return (
              <article
                aria-hidden={!isActive}
                aria-label={`Offer ${index + 1} of ${slides.length}`}
                aria-roledescription="slide"
                className={`absolute left-1/2 top-0 grid w-[min(86vw,82rem)] overflow-hidden rounded-lg border border-white/15 bg-card text-left shadow-2xl shadow-black/45 transition-[opacity,transform,filter] duration-500 ease-out [backface-visibility:hidden] [transform-style:preserve-3d] md:min-h-[34rem] md:grid-cols-[minmax(0,1fr)_minmax(23rem,0.78fr)] lg:grid-cols-[minmax(0,1fr)_minmax(31rem,0.82fr)] ${
                  visible ? "" : "pointer-events-none"
                }`}
                key={item.id}
                role="group"
                style={slideStyle(offset, prefersReducedMotion)}
              >
                <div className="flex min-h-[32rem] flex-col justify-center px-8 py-10 lg:min-h-[36rem] lg:px-16">
                  <p className="w-fit rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white">
                    {displayType(item.type)}
                  </p>
                  <h3 className="mt-5 line-clamp-3 text-4xl font-bold leading-tight text-foreground lg:text-6xl">
                    {item.title}
                  </h3>
                  {item.body ? (
                    <p className="mt-5 line-clamp-5 text-base leading-7 text-secondary sm:text-lg">
                      {item.body}
                    </p>
                  ) : (
                    <p className="mt-5 text-base leading-7 text-secondary sm:text-lg">
                      More details will be available soon.
                    </p>
                  )}
                </div>

                {item.imageUrl ? (
                  <div className="min-h-64 overflow-hidden border-t border-border bg-soft-blue lg:min-h-full lg:border-l lg:border-t-0">
                    <PublicContentImage
                      alt={item.title}
                      className="h-full min-h-[32rem] w-full lg:min-h-[36rem]"
                      eager={isActive}
                      src={item.imageUrl}
                    />
                  </div>
                ) : (
                  <FallbackVisual title={item.title} />
                )}
              </article>
            );
          })}
        </div>

        {hasMultipleItems ? (
          <>
            <button
              aria-label="Previous offer"
              className="absolute left-2 top-1/2 z-40 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-lg backdrop-blur transition-[background-color,border-color,color,transform] hover:border-white/60 hover:bg-white/15 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-3 sm:size-12 md:left-4 lg:left-6"
              onClick={() => showPrevious()}
              type="button"
            >
              <ArrowIcon direction="left" />
            </button>

            <button
              aria-label="Next offer"
              className="absolute right-2 top-1/2 z-40 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-lg backdrop-blur transition-[background-color,border-color,color,transform] hover:border-white/60 hover:bg-white/15 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-3 sm:size-12 md:right-4 lg:right-6"
              onClick={() => showNext()}
              type="button"
            >
              <ArrowIcon direction="right" />
            </button>
          </>
        ) : null}
      </div>

      {hasMultipleItems ? (
        <div
          aria-label="Choose offer"
          className="mx-auto mt-5 flex min-h-12 items-center justify-center gap-2"
          role="group"
        >
          {slides.map((item, index) => (
            <button
              aria-label={`Go to offer ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`h-3 rounded-full border transition-[width,background-color,border-color,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                index === activeIndex
                  ? "w-9 border-brand bg-brand"
                  : "w-3 border-white/35 bg-white/25 hover:border-white/70 hover:bg-white/45"
              }`}
              key={item.id}
              onClick={() => showItem(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
