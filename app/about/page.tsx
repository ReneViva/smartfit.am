import Link from "next/link";

import { PublicLayout } from "../../components/layout/public-layout";
import { JsonLd } from "../../components/public/json-ld";
import {
  createBreadcrumbJsonLd,
  createPublicMetadata,
} from "../../lib/seo";
import { getPublicSettings } from "../../lib/public-data";

export const dynamic = "force-dynamic";
export const metadata = createPublicMetadata({
  description:
    "Learn about Smartfit.am's training atmosphere, gym services, and practical approach to building a consistent fitness routine.",
  path: "/about",
  title: "About Smartfit.am - Gym, Training Atmosphere & Services",
});

const ABOUT_HERO_IMAGE =
  "/images/danielle-cerullo-CQfNt66ttZM-unsplash.jpg";
const ABOUT_STORY_IMAGE = "/images/young-fitness-man-studio.jpg";
const ABOUT_ENERGY_IMAGE =
  "/images/anastase-maragos-9dzWZQWZMdE-unsplash.jpg";
const ABOUT_TRAINING_IMAGE =
  "/images/victor-freitas-WvDYdXDzkhs-unsplash.jpg";

const primaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const darkCta =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-sm backdrop-blur transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const values = [
  {
    label: "Training atmosphere",
    text: "A focused space for showing up, building habits, and making training feel approachable.",
  },
  {
    label: "Flexible packages",
    text: "Public package categories make gym access, training, and services easier to compare.",
  },
  {
    label: "Coaching support",
    text: "Active coach profiles help visitors understand who can support their training routine.",
  },
  {
    label: "Live planning",
    text: "The public Our App page helps visitors check the current crowd before they visit.",
  },
] as const;

export default async function AboutPage() {
  const settings = await getPublicSettings();
  const gymName = settings?.gymName ?? "Smartfit.am";

  return (
    <PublicLayout fullWidth>
      <JsonLd data={createBreadcrumbJsonLd("About", "/about")} />

      <section className="home-full-bleed relative isolate flex min-h-[82svh] items-center overflow-hidden bg-black text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${ABOUT_HERO_IMAGE}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/82 via-black/55 to-[#061521]/95"
        />
        <div className="home-wide-rail relative py-28 text-center sm:py-32">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
            About {gymName}
          </p>
          <h1 className="mx-auto mt-3 max-w-5xl text-4xl font-bold text-white sm:text-6xl lg:text-7xl">
            Built for better training days
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/80 sm:text-xl sm:leading-8">
            {gymName} is a welcoming place for focused training, steady
            progress, and a healthier daily routine.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link className={primaryCta} href="/packages">
              View packages
            </Link>
            <Link className={darkCta} href="/coaches">
              Meet coaches
            </Link>
            <Link className={darkCta} href="/our-app">
              Our App
            </Link>
          </div>
        </div>
      </section>

      <section className="home-full-bleed bg-[#05070a] py-12 text-white sm:py-16 lg:py-20">
        <div className="home-wide-rail grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.65fr)] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
              Brand story
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-5xl">
              Practical training, strong energy, clear choices
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              Smartfit.am keeps the gym experience direct and useful: public
              package information, active coach profiles, a gallery of the
              space, contact details, and live crowd planning from one public
              website.
            </p>
          </div>
          <div className="relative min-h-72 overflow-hidden rounded-lg border border-white/15 bg-black shadow-2xl shadow-black/30 sm:min-h-96">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("${ABOUT_STORY_IMAGE}")` }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
            />
          </div>
        </div>
      </section>

      <section className="home-wide-rail py-12 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
            What shapes the experience
          </p>
          <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-5xl">
            Built around the way people actually train
          </h2>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {values.map((value) => (
            <article
              className="public-interactive-card min-h-48 rounded-lg border border-border bg-card p-5 shadow-sm"
              key={value.label}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-soft-blue text-lg font-bold text-brand">
                {value.label.charAt(0)}
              </span>
              <h3 className="mt-5 text-xl font-bold text-foreground">
                {value.label}
              </h3>
              <p className="mt-3 text-sm leading-6 text-secondary">
                {value.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-full-bleed overflow-hidden bg-page py-12 sm:py-16">
        <div className="home-wide-rail grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <figure className="group relative min-h-80 overflow-hidden rounded-lg border border-border bg-card shadow-sm lg:min-h-[34rem]">
            <img
              alt="Smartfit.am training area"
              className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
              src={ABOUT_TRAINING_IMAGE}
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-black/68 px-5 py-4 text-white">
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand">
                Training floor
              </span>
            </figcaption>
          </figure>
          <div className="grid gap-4">
            <figure className="group relative min-h-64 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <img
                alt="Smartfit.am gym energy"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={ABOUT_ENERGY_IMAGE}
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-black/68 px-5 py-4 text-white">
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand">
                  Gym energy
                </span>
              </figcaption>
            </figure>
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
                Public-safe planning
              </p>
              <h3 className="mt-2 text-2xl font-bold text-foreground">
                See the gym, compare options, plan your visit
              </h3>
              <p className="mt-3 text-sm leading-6 text-secondary">
                The public website shows gym-wide information only. It never
                exposes member packages, visit history, notes, documents, or
                internal records.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-full-bleed bg-[#061521] py-12 text-white sm:py-16">
        <div className="home-wide-rail flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
              Start here
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-5xl">
              Your next training day starts with one tap
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className={primaryCta} href="/packages">
              Packages
            </Link>
            <Link className={darkCta} href="/contact">
              Contact
            </Link>
            <Link className={darkCta} href="/gallery">
              Gallery
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
