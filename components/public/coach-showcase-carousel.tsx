"use client";

import type { CSSProperties, KeyboardEvent, UIEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CoachPhoto } from "./coach-photo";

export type CoachShowcaseItem = {
  description: string | null;
  firstName: string;
  id: string;
  lastName: string;
  photoUrl: string | null;
  specialty: string;
};

const COACH_ROTATION_INTERVAL_MS = 7200;

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

function normalizedOffset(index: number, activeIndex: number, length: number) {
  let offset = index - activeIndex;

  if (offset > length / 2) {
    offset -= length;
  } else if (offset < -length / 2) {
    offset += length;
  }

  return offset;
}

function cardStyle({
  hovered,
  offset,
  prefersReducedMotion,
}: {
  hovered: boolean;
  offset: number;
  prefersReducedMotion: boolean;
}): CSSProperties {
  if (prefersReducedMotion || offset === 0) {
    return {
      opacity: offset === 0 ? 1 : 0,
      transform: `translate3d(-50%, ${hovered ? "-0.45rem" : "0"}, 0) scale(${
        hovered ? 1.035 : 1
      })`,
      zIndex: offset === 0 ? 30 : 0,
    };
  }

  const direction = offset > 0 ? 1 : -1;
  const scale = hovered ? 0.88 : 0.84;

  return {
    opacity: Math.abs(offset) === 1 ? 0.72 : 0,
    transform: `translate3d(calc(-50% + ${
      direction * 21
    }rem), ${hovered ? "1.1rem" : "1.6rem"}, -120px) rotateY(${
      direction * -10
    }deg) scale(${scale})`,
    zIndex: Math.abs(offset) === 1 ? 20 : 0,
  };
}

export function CoachShowcaseCarousel({
  coaches,
}: {
  coaches: CoachShowcaseItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const mobileSlideRefs = useRef<Array<HTMLElement | null>>([]);
  const hasMultipleCoaches = coaches.length > 1;

  const scrollMobileSlideIntoView = useCallback((index: number) => {
    const slide = mobileSlideRefs.current[index];

    if (!slide || !window.matchMedia("(max-width: 767px)").matches) {
      return;
    }

    slide.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, []);

  const showItem = useCallback(
    (index: number) => {
      const nextIndex = (index + coaches.length) % coaches.length;

      setActiveIndex(nextIndex);
      window.requestAnimationFrame(() => scrollMobileSlideIntoView(nextIndex));
    },
    [coaches.length, scrollMobileSlideIntoView],
  );

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      const nextIndex = (current + 1) % coaches.length;

      window.requestAnimationFrame(() => scrollMobileSlideIntoView(nextIndex));

      return nextIndex;
    });
  }, [coaches.length, scrollMobileSlideIntoView]);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => {
      const nextIndex = (current - 1 + coaches.length) % coaches.length;

      window.requestAnimationFrame(() => scrollMobileSlideIntoView(nextIndex));

      return nextIndex;
    });
  }, [coaches.length, scrollMobileSlideIntoView]);

  useEffect(() => {
    if (activeIndex >= coaches.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, coaches.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!hasMultipleCoaches || paused || prefersReducedMotion) {
      return;
    }

    const timer = window.setTimeout(showNext, COACH_ROTATION_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [
    activeIndex,
    hasMultipleCoaches,
    paused,
    prefersReducedMotion,
    showNext,
  ]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasMultipleCoaches) {
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

  if (!coaches.length) {
    return null;
  }

  return (
    <div
      aria-label="Featured coaches"
      aria-roledescription="carousel"
      className="mt-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
      onFocusCapture={() => setPaused(true)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setHoveredIndex(null);
        setPaused(false);
      }}
      role="region"
      tabIndex={0}
    >
      <div
        className="home-scroll-snap -mx-[2vw] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[2vw] pb-2 md:hidden"
        onScroll={handleMobileScroll}
      >
        {coaches.map((coach, index) => {
          const coachName = `${coach.firstName} ${coach.lastName}`;

          return (
            <article
              aria-label={`${coachName}, coach ${index + 1} of ${
                coaches.length
              }`}
              aria-roledescription="slide"
              className="w-[84vw] max-w-[22rem] shrink-0 snap-center overflow-hidden rounded-lg border border-border bg-card text-left shadow-xl shadow-black/10"
              key={coach.id}
              ref={(element) => {
                mobileSlideRefs.current[index] = element;
              }}
              role="group"
            >
              <div className="public-image-card h-44 overflow-hidden bg-soft-blue">
                <CoachPhoto
                  className="!aspect-auto h-full"
                  fallbackClassName="!aspect-auto h-full !p-8"
                  name={coachName}
                  photoUrl={coach.photoUrl}
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand">
                  {coach.specialty}
                </p>
                <h3 className="mt-2 text-xl font-bold text-foreground">
                  {coachName}
                </h3>
                {coach.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary">
                    {coach.description}
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-secondary">
                    Practical guidance for focused training days.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="relative mx-auto hidden h-[36rem] max-w-[100rem] overflow-hidden [perspective:1500px] md:block lg:h-[38rem]">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-8 h-[29rem] w-[min(82vw,68rem)] -translate-x-1/2 rotate-[-2deg] rounded-lg border border-brand/20 bg-soft-blue/40 shadow-2xl shadow-brand/10"
        />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-12 h-[27rem] w-[min(74vw,56rem)] -translate-x-1/2 rotate-[2deg] rounded-lg border border-border bg-card/80 shadow-xl"
        />

        {coaches.map((coach, index) => {
          const offset = normalizedOffset(index, activeIndex, coaches.length);
          const isActive = offset === 0;
          const visible =
            Math.abs(offset) <= 1 && (!prefersReducedMotion || isActive);
          const coachName = `${coach.firstName} ${coach.lastName}`;

          return (
            <article
              aria-hidden={!isActive}
              aria-label={`${coachName}, coach ${index + 1} of ${
                coaches.length
              }`}
              aria-roledescription="slide"
              className={`absolute left-1/2 top-4 w-[min(46vw,33rem)] overflow-hidden rounded-lg border border-border bg-card text-left shadow-2xl shadow-black/15 transition-[opacity,transform,filter] duration-500 ease-out [backface-visibility:hidden] [transform-style:preserve-3d] motion-reduce:transition-none ${
                visible ? "" : "pointer-events-none"
              }`}
              key={coach.id}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              role="group"
              style={cardStyle({
                hovered: hoveredIndex === index,
                offset,
                prefersReducedMotion,
              })}
            >
              <div className="public-image-card h-72 overflow-hidden bg-soft-blue lg:h-80">
                <CoachPhoto
                  className="!aspect-auto h-full"
                  fallbackClassName="!aspect-auto h-full"
                  name={coachName}
                  photoUrl={coach.photoUrl}
                />
              </div>
              <div className="p-6 lg:p-7">
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">
                  {coach.specialty}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                  {coachName}
                </h3>
                {coach.description ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-secondary">
                    {coach.description}
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-secondary">
                    Practical guidance for focused training days.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {hasMultipleCoaches ? (
        <div className="mx-auto mt-4 flex max-w-xl items-center justify-between gap-4">
          <button
            aria-label="Previous coach"
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:text-brand active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transform-none"
            onClick={showPrevious}
            type="button"
          >
            <ArrowIcon direction="left" />
          </button>

          <div
            aria-label="Choose coach"
            className="flex min-h-12 flex-wrap items-center justify-center gap-2"
            role="group"
          >
            {coaches.map((coach, index) => (
              <button
                aria-label={`Go to coach ${index + 1}`}
                aria-pressed={index === activeIndex}
                className={`h-3 rounded-full border transition-[width,background-color,border-color,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  index === activeIndex
                    ? "w-9 border-brand bg-brand"
                    : "w-3 border-border bg-neutral hover:border-brand hover:bg-soft-blue"
                }`}
                key={coach.id}
                onClick={() => showItem(index)}
                type="button"
              />
            ))}
          </div>

          <button
            aria-label="Next coach"
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:text-brand active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transform-none"
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
