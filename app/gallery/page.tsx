import Link from "next/link";

import { PublicLayout } from "../../components/layout/public-layout";
import { EmptyState } from "../../components/public/empty-state";
import { GalleryGrid } from "../../components/public/gallery-grid";
import { JsonLd } from "../../components/public/json-ld";
import { getActiveGalleryImages } from "../../lib/public-data";
import {
  createBreadcrumbJsonLd,
  createPublicMetadata,
} from "../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicMetadata({
  description:
    "View the Smartfit.am gym, equipment, training areas, and atmosphere in the public gallery.",
  path: "/gallery",
  title: "Smartfit.am Gallery - Gym, Equipment & Training Areas",
});

const GALLERY_HERO_IMAGE =
  "/images/anastase-maragos-9dzWZQWZMdE-unsplash.jpg";

const featuredImages = [
  {
    alt: "Smartfit.am strength training floor",
    image: "/images/victor-freitas-WvDYdXDzkhs-unsplash.jpg",
    label: "Strength zone",
  },
  {
    alt: "Smartfit.am focused studio training",
    image: "/images/danielle-cerullo-CQfNt66ttZM-unsplash.jpg",
    label: "Studio rhythm",
  },
  {
    alt: "Smartfit.am coached performance session",
    image:
      "/images/powerful-stylish-bodybuilder-with-tattoo-his-arm-doing-exercises-with-dumbbells-isolated-dark-background.jpg",
    label: "Performance detail",
  },
];

const galleryNotes = [
  "Training floor",
  "Coaching moments",
  "Equipment details",
  "Everyday atmosphere",
];

export default async function GalleryPage() {
  const images = await getActiveGalleryImages();

  return (
    <PublicLayout fullWidth>
      <JsonLd data={createBreadcrumbJsonLd("Gallery", "/gallery")} />

      <section className="home-full-bleed relative isolate flex min-h-[82svh] items-end overflow-hidden bg-black text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${GALLERY_HERO_IMAGE}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-[#05070a]"
        />
        <div className="home-wide-rail relative py-28 sm:py-32">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">
            Inside Smartfit.am
          </p>
          <h1 className="mt-4 max-w-5xl text-5xl font-bold text-white sm:text-7xl">
            A place built to move
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-xl sm:leading-8">
            Explore the spaces, equipment, atmosphere, and energy that make each
            training day feel focused.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {galleryNotes.map((note) => (
              <span
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur"
                key={note}
              >
                {note}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="home-full-bleed overflow-hidden bg-[#05070a] py-12 text-white sm:py-16 lg:py-20">
        <div className="home-wide-rail grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">
              Atmosphere
            </p>
            <h2 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
              Bright focus, strong details, real training days
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
              The gallery highlights the public face of Smartfit.am: the floor,
              the equipment, and the mood of a gym designed for consistent work.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-primary-hover"
                href="/packages"
              >
                Explore packages
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-white/15"
                href="/contact"
              >
                Visit the gym
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {featuredImages.map((image, index) => (
              <figure
                className={`public-image-card relative min-h-72 overflow-hidden rounded-lg border border-white/15 bg-white/10 shadow-2xl shadow-black/25 ${
                  index === 0
                    ? "sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:min-h-[34rem]"
                    : ""
                }`}
                key={image.label}
              >
                <img
                  alt={image.alt}
                  className="absolute inset-0 size-full object-cover object-center"
                  loading={index === 0 ? "eager" : "lazy"}
                  src={image.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 px-5 py-4 text-lg font-bold text-white">
                  {image.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="home-wide-rail py-12 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">
              Public gallery
            </p>
            <h2 className="mt-2 text-4xl font-bold text-foreground sm:text-5xl">
              Moments from the floor
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">
              Fresh public images appear here as the Smartfit.am team curates
              new views from the gym.
            </p>
          </div>
          <p className="rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm">
            {images.length} image{images.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-7">
          {images.length ? (
            <GalleryGrid images={images} />
          ) : (
            <EmptyState>
              Fresh views from the gym floor will be available soon.
            </EmptyState>
          )}
        </div>
      </section>

      <section className="home-full-bleed bg-page pb-12 sm:pb-16">
        <div className="home-wide-rail overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.6fr)]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">
                See it live
              </p>
              <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
                The best view is your first workout
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-secondary">
                Check live gym status before you arrive, then choose the visit
                time that fits your day.
              </p>
              <Link
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-primary-hover"
                href="/our-app"
              >
                Open live status
              </Link>
            </div>
            <div
              aria-hidden="true"
              className="min-h-72 bg-cover bg-center lg:min-h-full"
              style={{
                backgroundImage:
                  'url("/images/84b59626-2c9e-4420-8269-8e34e607bfdc_z2kw5u.avif")',
              }}
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
