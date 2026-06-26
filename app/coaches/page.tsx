import Link from "next/link";

import { PublicLayout } from "../../components/layout/public-layout";
import { CoachPhoto } from "../../components/public/coach-photo";
import { CoachShowcaseCarousel } from "../../components/public/coach-showcase-carousel";
import { EmptyState } from "../../components/public/empty-state";
import { JsonLd } from "../../components/public/json-ld";
import { getActiveCoaches } from "../../lib/public-data";
import {
  createBreadcrumbJsonLd,
  createPublicMetadata,
} from "../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicMetadata({
  description:
    "Meet Smartfit.am coaches, explore their training specialties, and find practical fitness support for your goals.",
  path: "/coaches",
  title: "Smartfit.am Coaches - Trainers, Specialties & Fitness Support",
});

const COACH_HERO_IMAGE =
  "/images/powerful-stylish-bodybuilder-with-tattoo-his-arm-doing-exercises-with-dumbbells-isolated-dark-background.jpg";
const COACH_SECTION_IMAGE =
  "/images/anastase-maragos-9dzWZQWZMdE-unsplash.jpg";

const primaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const darkCta =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-sm backdrop-blur transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function CoachCategoryPills({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  if (!categories.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {categories.map((category) => (
        <span
          className="rounded-full border border-brand/20 bg-soft-blue px-3 py-1 text-xs font-bold text-brand"
          key={category.slug}
        >
          {category.name}
        </span>
      ))}
    </div>
  );
}

export default async function CoachesPage() {
  const coaches = await getActiveCoaches();

  return (
    <PublicLayout fullWidth>
      <JsonLd data={createBreadcrumbJsonLd("Coaches", "/coaches")} />

      <section className="home-full-bleed relative isolate flex min-h-[82svh] items-center overflow-hidden bg-black text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${COACH_HERO_IMAGE}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/78 via-black/58 to-[#061521]/95"
        />
        <div className="home-wide-rail relative py-28 text-center sm:py-32">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
            Coaches
          </p>
          <h1 className="mx-auto mt-3 max-w-5xl text-4xl font-bold text-white sm:text-6xl lg:text-7xl">
            Guidance for stronger training days
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/80 sm:text-xl sm:leading-8">
            Meet the active coaches who help Smartfit.am members train with
            focus and confidence.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link className={primaryCta} href="/packages">
              View packages
            </Link>
            <Link className={darkCta} href="/contact">
              Contact
            </Link>
          </div>
        </div>
      </section>

      <section className="home-full-bleed overflow-hidden bg-[#05070a] py-12 text-white sm:py-16 lg:py-20">
        <div className="home-wide-rail">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
                Featured guidance
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white sm:text-5xl">
                Coach support, shown with focus
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
                Public coach profiles show name, specialty, description, and
                image only.
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 px-5 py-4 text-left shadow-xl shadow-black/20">
              <p className="text-3xl font-bold text-white">{coaches.length}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/60">
                active coach{coaches.length === 1 ? "" : "es"}
              </p>
            </div>
          </div>

          {coaches.length ? (
            <CoachShowcaseCarousel coaches={coaches} />
          ) : (
            <div className="mt-8">
              <EmptyState>Coach profiles will be available soon.</EmptyState>
            </div>
          )}
        </div>
      </section>

      {coaches.length ? (
        <section className="home-wide-rail py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
              Coach roster
            </p>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-5xl">
              Find the training style that fits you
            </h2>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {coaches.map((coach) => {
              const coachName = `${coach.firstName} ${coach.lastName}`;

              return (
                <article
                  className="public-interactive-card overflow-hidden rounded-lg border border-border bg-card shadow-sm"
                  key={coach.id}
                >
                  <div className="public-image-card h-56 overflow-hidden bg-soft-blue sm:h-64">
                    <CoachPhoto
                      className="!aspect-auto h-full"
                      fallbackClassName="!aspect-auto h-full"
                      name={coachName}
                      photoUrl={coach.photoUrl}
                    />
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand">
                      {coach.specialty}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-foreground">
                      {coachName}
                    </h3>
                    <CoachCategoryPills categories={coach.categories} />
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
        </section>
      ) : null}

      <section className="home-full-bleed relative isolate overflow-hidden bg-[#061521] py-12 text-white sm:py-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url("${COACH_SECTION_IMAGE}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#061521] via-[#061521]/88 to-black/70"
        />
        <div className="home-wide-rail relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
              Ready to compare options?
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-5xl">
              Pair coaching with the package that fits your routine
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className={primaryCta} href="/packages">
              Packages
            </Link>
            <Link className={darkCta} href="/our-app">
              Our App
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
