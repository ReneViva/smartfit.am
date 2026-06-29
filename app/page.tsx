import Link from "next/link";

import { PublicLayout } from "../components/layout/public-layout";
import { CoachShowcaseCarousel } from "../components/public/coach-showcase-carousel";
import { EmptyState } from "../components/public/empty-state";
import { GalleryGrid } from "../components/public/gallery-grid";
import { HeroBackgroundCarousel } from "../components/public/hero-background-carousel";
import { JsonLd } from "../components/public/json-ld";
import { PublicContentCarousel } from "../components/public/public-content-carousel";
import { ScrollToTopButton } from "../components/public/scroll-to-top-button";
import { Card } from "../components/ui/card";
import {
  getActiveCoaches,
  getActiveGalleryImages,
  getActivePackages,
  getActivePublicContent,
  getPublicAppData,
  getPublicSettings,
} from "../lib/public-data";
import {
  createPublicMetadata,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  getAbsoluteUrl,
} from "../lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicMetadata({
  description: DEFAULT_SITE_DESCRIPTION,
  path: "/",
  title: DEFAULT_SITE_TITLE,
});

const primaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const secondaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const heroSecondaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-sm backdrop-blur transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const HOME_HERO_IMAGES = [
  {
    position: "center",
    src: "/images/danielle-cerullo-CQfNt66ttZM-unsplash.jpg",
  },
  {
    position: "center 42%",
    src: "/images/victor-freitas-WvDYdXDzkhs-unsplash.jpg",
  },
  {
    position: "center",
    src: "/images/young-fitness-man-studio.jpg",
  },
  {
    position: "center",
    src: "/images/anastase-maragos-9dzWZQWZMdE-unsplash.jpg",
  },
] as const;
const HOME_CAMPAIGN_IMAGE =
  "/images/powerful-stylish-bodybuilder-with-tattoo-his-arm-doing-exercises-with-dumbbells-isolated-dark-background.jpg";
const HOME_PACKAGES_IMAGE = "/images/victor-freitas-WvDYdXDzkhs-unsplash.jpg";

function formatAmd(value: string) {
  const price = Number(value);

  return Number.isFinite(price)
    ? `${new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
      }).format(price)} AMD`
    : `${value} AMD`;
}

const sectionLinks = [
  {
    caption: "Gym atmosphere",
    href: "#home-about",
    label: "About us",
  },
  {
    caption: "Training support",
    href: "#home-coaches",
    label: "Coaches",
  },
  {
    caption: "Plans and services",
    href: "#home-packages",
    label: "Packages",
  },
  {
    caption: "Space and energy",
    href: "#home-gallery",
    label: "Gallery",
  },
  {
    caption: "Visit details",
    href: "#home-contact",
    label: "Contact",
  },
] as const;

function SectionHeading({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: { href: string; label: string };
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-5">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand sm:text-sm">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-secondary sm:text-base sm:leading-7">
          {description}
        </p>
      </div>
      {action ? (
        <Link className={secondaryCta} href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function ArrowCue() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-brand shadow-sm transition-[background-color,border-color,color,transform] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-brand group-hover:bg-brand group-hover:text-white"
    >
      <svg
        className="size-4 fill-none stroke-current stroke-2"
        viewBox="0 0 24 24"
      >
        <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function HomeSectionNavigation({
  crowdLabel,
  currentCount,
}: {
  crowdLabel: string;
  currentCount: number;
}) {
  return (
    <section
      aria-label="Homepage sections"
      className="public-section-enter home-wide-rail grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.42fr)]"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {sectionLinks.map((item) => (
          <a
            className="group relative flex min-h-24 cursor-pointer flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-1 hover:border-brand hover:bg-soft-blue hover:shadow-xl hover:shadow-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px sm:min-h-32 sm:p-4"
            href={item.href}
            key={item.href}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="text-sm font-bold text-foreground sm:text-base">
                {item.label}
              </span>
              <ArrowCue />
            </span>
            <span className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-secondary transition-colors group-hover:text-primary-active">
              {item.caption}
            </span>
          </a>
        ))}
      </div>

      <Link
        className="group relative isolate flex min-h-40 cursor-pointer flex-col justify-between overflow-hidden rounded-lg border border-brand/70 bg-[#061521] p-4 text-white shadow-xl shadow-brand/10 transition-[box-shadow,transform] hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px sm:min-h-48 sm:p-5"
        href="/our-app"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(0,155,223,0.34),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]"
        />
        <span>
          <span className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand">
              Our App
            </span>
            <span
              aria-hidden="true"
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-[background-color,transform] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-brand"
            >
              <svg
                className="size-4 fill-none stroke-current stroke-2"
                viewBox="0 0 24 24"
              >
                <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" />
              </svg>
            </span>
          </span>
          <span className="mt-2 block text-xl font-bold text-white sm:text-2xl">
            Check live gym occupancy
          </span>
        </span>
        <span className="mt-5 flex items-end justify-between gap-4">
          <span className="text-sm font-semibold text-white/70">
            {crowdLabel}
          </span>
          <span className="text-5xl font-bold leading-none text-brand">
            {currentCount}
          </span>
        </span>
      </Link>
    </section>
  );
}

export default async function Home() {
  const [settings, content, coaches, packages, gallery, appData] =
    await Promise.all([
      getPublicSettings(),
      getActivePublicContent(),
      getActiveCoaches(3),
      getActivePackages(3),
      getActiveGalleryImages(6),
      getPublicAppData(),
    ]);
  const gymName = settings?.gymName ?? appData.gymName;
  const siteUrl = getAbsoluteUrl("/");
  const organizationId = `${siteUrl}#organization`;
  const sameAs = [settings?.instagramLink, settings?.whatsappLink].filter(
    (link): link is string => Boolean(link),
  );
  const gymStructuredData: Record<string, unknown> = {
    "@id": organizationId,
    "@type": "ExerciseGym",
    logo: settings?.logoUrl ?? getAbsoluteUrl("/logo/Logo.svg"),
    name: gymName,
    url: siteUrl,
  };

  if (settings?.contactNumber) {
    gymStructuredData.telephone = settings.contactNumber;
  }

  if (settings?.address) {
    gymStructuredData.address = {
      "@type": "PostalAddress",
      streetAddress: settings.address,
    };
  }

  if (settings?.mapLink) {
    gymStructuredData.hasMap = settings.mapLink;
  }

  if (sameAs.length) {
    gymStructuredData.sameAs = sameAs;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": `${siteUrl}#website`,
        "@type": "WebSite",
        name: gymName,
        publisher: {
          "@id": organizationId,
        },
        url: siteUrl,
      },
      gymStructuredData,
    ],
  };
  const heroContent = content.find((item) => item.type === "HERO");
  const offers = content.filter((item) => item.type !== "HERO");
  const occupancyStatusClasses = {
    high: "border-status-high text-status-high",
    low: "border-status-low text-status-low",
    medium: "border-status-medium text-foreground",
  } as const;

  return (
    <PublicLayout fullWidth>
      <JsonLd data={structuredData} />

      <section className="public-section-enter home-full-bleed relative isolate flex min-h-[100svh] items-center overflow-hidden bg-black text-white">
        <HeroBackgroundCarousel images={HOME_HERO_IMAGES} />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/58 to-[#061521]/95"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,155,223,0.12),transparent_48%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-page"
        />

        <div className="home-wide-rail relative flex flex-col items-center py-24 text-center lg:py-32">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80 sm:text-sm">
            Current at {gymName}
          </p>
          <h1 className="mt-3 text-4xl font-bold text-white sm:text-7xl lg:text-8xl">
            {gymName}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/85 sm:text-2xl sm:leading-9">
            A focused place to train, compare active packages, and check the
            live crowd before your next visit.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link className={primaryCta} href="/packages">
              View packages
            </Link>
            <Link className={heroSecondaryCta} href="/contact">
              Contact
            </Link>
            <Link className={heroSecondaryCta} href="/our-app">
              Our App
            </Link>
          </div>

          <div className="mt-8 grid w-full max-w-4xl gap-3 text-left sm:mt-10 sm:grid-cols-3">
            <div className="rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur sm:p-4">
              <p className="text-2xl font-bold text-white sm:text-3xl">
                {packages.length}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/70 sm:text-sm">
                package previews
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur sm:p-4">
              <p className="text-2xl font-bold text-white sm:text-3xl">
                {coaches.length}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/70 sm:text-sm">
                coach previews
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur sm:p-4">
              <p className="text-2xl font-bold text-white sm:text-3xl">
                {appData.occupancy.currentCount}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/70 sm:text-sm">
                inside now
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-full-bleed relative isolate overflow-hidden bg-[#05070a] py-12 text-white sm:py-16 lg:py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: `url("${HOME_CAMPAIGN_IMAGE}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(0,155,223,0.32),transparent_34%),linear-gradient(90deg,rgba(5,7,10,0.96),rgba(5,7,10,0.78)_42%,rgba(5,7,10,0.94))]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-white/25"
        />

        <div className="home-wide-rail relative">
          <div className="mb-8 max-w-4xl lg:mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
              Offers and announcements
            </p>
            <h2 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-5xl">
              Current campaigns from the gym floor
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75 sm:text-base sm:leading-7">
              Active public offers, updates, and announcements shown in a wide
              campaign carousel.
            </p>
          </div>

          <PublicContentCarousel gymName={gymName} items={offers} />
        </div>
      </section>

      <section className="home-full-bleed bg-[#05070a] px-0 pb-12 text-white sm:pb-16">
        <div className="home-wide-rail overflow-hidden rounded-lg border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/25 backdrop-blur sm:p-7 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
              Train with momentum
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-4xl">
              Public updates without private member details
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              The homepage campaign area stays focused on offers and gym-wide
              announcements only.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-sm lg:mt-0">
            <div className="rounded-lg border border-white/15 bg-black/25 p-4">
              <p className="text-2xl font-bold text-white sm:text-3xl">
                {offers.length || 3}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/60">
                public items
              </p>
            </div>
            <div className="rounded-lg border border-brand/40 bg-brand/15 p-4">
              <p className="text-2xl font-bold text-white sm:text-3xl">Now</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/60">
                gym pulse
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full overflow-hidden py-10 sm:py-14">
        <HomeSectionNavigation
          crowdLabel={appData.occupancy.crowdLabel}
          currentCount={appData.occupancy.currentCount}
        />

        <section
          className="public-section-enter scroll-mt-section home-wide-rail mt-12 sm:mt-16"
          id="home-about"
        >
        <SectionHeading
          action={{ href: "/about", label: "Read more" }}
          description={
            heroContent?.body ??
            "A focused, welcoming place for consistent training, flexible services, and stronger daily routines."
          }
          eyebrow="About us"
          title={heroContent?.title ?? "Built for better training days"}
        />
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          <Card className="public-interactive-card !p-4 sm:!p-6">
            <h3 className="text-xl font-bold text-foreground">
              Practical training
            </h3>
            <p className="mt-3 text-sm leading-6 text-secondary">
              Simple routines, clear options, and steady progress for members
              at every starting point.
            </p>
          </Card>
          <Card className="public-interactive-card !p-4 sm:!p-6">
            <h3 className="text-xl font-bold text-foreground">
              Flexible services
            </h3>
            <p className="mt-3 text-sm leading-6 text-secondary">
              Gym access, training, swimming, cardio, and service-style
              packages stay easy to compare.
            </p>
          </Card>
          <Card className="public-interactive-card !p-4 sm:!p-6">
            <h3 className="text-xl font-bold text-foreground">
              Live planning
            </h3>
            <p className="mt-3 text-sm leading-6 text-secondary">
              The public Our App page helps visitors plan around the current
              gym crowd without showing private member data.
            </p>
          </Card>
        </div>
      </section>

      <section
        className="public-section-enter scroll-mt-section home-full-bleed relative isolate mt-12 overflow-hidden py-12 sm:mt-16 lg:py-16"
        id="home-packages"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center lg:bg-fixed"
          style={{ backgroundImage: `url("${HOME_PACKAGES_IMAGE}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/68 to-[#061521]/92"
        />
        <div className="home-wide-rail relative">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                Packages and services
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-4xl">
                Find your way to move
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base sm:leading-7">
                Choose gym access, training, swimming, cardio, and other active
                services that fit your routine.
              </p>
            </div>
            <Link className={heroSecondaryCta} href="/packages">
              Explore all packages
            </Link>
          </div>
        {packages.length ? (
          <div className="home-scroll-snap -mx-[2vw] mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[2vw] pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
            {packages.map((gymPackage) => (
              <article
                className="public-interactive-card flex w-[84vw] max-w-sm shrink-0 snap-center flex-col rounded-lg border border-border bg-card p-4 shadow-2xl shadow-black/20 md:w-auto md:max-w-none md:p-6"
                key={gymPackage.id}
              >
                <div className="flex flex-wrap gap-2">
                  {gymPackage.categories.length ? (
                    gymPackage.categories.map((category) => (
                      <span
                        className="w-fit rounded-full bg-soft-blue px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-primary-active sm:px-3 sm:text-xs"
                        key={category.slug}
                      >
                        {category.name}
                      </span>
                    ))
                  ) : (
                    <span className="w-fit rounded-full bg-neutral px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-secondary sm:px-3 sm:text-xs">
                      Package option
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-xl font-bold text-foreground sm:mt-5 sm:text-2xl">
                  {gymPackage.name}
                </h3>
                {gymPackage.discountPrice ? (
                  <div className="mt-3 sm:mt-4">
                    <p className="text-sm font-bold text-secondary line-through">
                      {formatAmd(gymPackage.price)}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-brand sm:text-3xl">
                      {formatAmd(gymPackage.discountPrice)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-2xl font-bold text-brand sm:mt-4 sm:text-3xl">
                    {formatAmd(gymPackage.price)}
                  </p>
                )}
                {gymPackage.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary sm:mt-4">
                    {gymPackage.description}
                  </p>
                ) : null}
                <Link
                  className="mt-auto pt-5 text-sm font-bold text-brand hover:text-primary-hover sm:pt-6 sm:text-base"
                  href="/packages"
                >
                  View details
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7">
            <EmptyState>Package information will be available soon.</EmptyState>
          </div>
        )}
        </div>
      </section>

      <section
        className="public-section-enter scroll-mt-section home-wide-rail mt-12 sm:mt-16"
        id="home-coaches"
      >
        <SectionHeading
          action={{ href: "/coaches", label: "Meet all coaches" }}
          description="Train with focused guidance from active Smartfit.am coaches."
          eyebrow="Professional guidance"
          title="Coaches who keep progress practical"
        />
        {coaches.length ? (
          <CoachShowcaseCarousel coaches={coaches} />
        ) : (
          <div className="mt-7">
            <EmptyState>Coach profiles will be available soon.</EmptyState>
          </div>
        )}
      </section>

      <section
        className="public-section-enter scroll-mt-section home-wide-rail mt-12 sm:mt-16"
        id="home-gallery"
      >
        <SectionHeading
          action={{ href: "/gallery", label: "Open gallery" }}
          description="A closer look at the spaces and atmosphere behind the training."
          eyebrow="Inside Smartfit.am"
          title="See the energy"
        />
        {gallery.length ? (
          <div className="mt-7">
            <GalleryGrid compact images={gallery} />
          </div>
        ) : (
          <div className="mt-7">
            <EmptyState>Fresh gym-floor views will be available soon.</EmptyState>
          </div>
        )}
      </section>

      <section
        className="public-section-enter scroll-mt-section home-wide-rail mt-12 grid gap-5 sm:mt-16 sm:gap-6 lg:grid-cols-[0.8fr_1.2fr]"
        id="home-app"
      >
        <Card className="flex flex-col justify-between bg-soft-blue !p-4 sm:!p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary-active">
              Our App
            </p>
            <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
              Know the crowd before you go
            </h2>
            <p className="mt-4 leading-7 text-secondary">
              Open the public Smartfit.am experience from your phone, check
              live occupancy, and add it to your home screen for one-tap
              access.
            </p>
          </div>
          <Link className={`${primaryCta} mt-7 w-fit`} href="/our-app">
            Open Our App
          </Link>
        </Card>

        <Card className="flex flex-col gap-5 !p-4 sm:flex-row sm:items-center sm:gap-6 sm:!p-6">
          <div
            className={`flex size-28 shrink-0 flex-col items-center justify-center rounded-full border-4 bg-card sm:size-32 ${
              appData.occupancy.crowdStatus
                ? occupancyStatusClasses[appData.occupancy.crowdStatus]
                : "border-border text-foreground"
            }`}
          >
            <span className="text-4xl font-bold leading-none sm:text-5xl">
              {appData.occupancy.currentCount}
            </span>
            <span className="mt-2 text-xs font-bold uppercase tracking-wide">
              inside
            </span>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">
              Live now
            </p>
            <h3 className="mt-2 text-2xl font-bold text-foreground">
              {appData.occupancy.crowdLabel}
            </h3>
            <p className="mt-3 text-sm leading-6 text-secondary">
              The public count shows total occupancy only and never reveals
              member or visit details.
            </p>
          </div>
        </Card>
      </section>

      <section
        className="public-section-enter scroll-mt-section home-wide-rail mt-12 sm:mt-16"
        id="home-contact"
      >
        <SectionHeading
          action={
            settings?.mapLink
              ? { href: settings.mapLink, label: "Open directions" }
              : { href: "/contact", label: "Contact us" }
          }
          description={
            settings?.address ??
            "Contact Smartfit.am for location and visit information."
          }
          eyebrow="Visit Smartfit.am"
          title="Your next training day starts here"
        />
        {appData.location?.mapEmbedUrl ? (
          <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <iframe
              allowFullScreen
              className="block h-[300px] w-full border-0 sm:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={appData.location.mapEmbedUrl}
              title={`${gymName} map`}
            />
          </div>
        ) : (
          <Card className="mt-7 flex flex-wrap items-center justify-between gap-5">
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                Ready when you are
              </h3>
              <p className="mt-2 text-secondary">
                Explore packages, check the crowd, or get in touch before your
                visit.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className={primaryCta} href="/packages">
                View packages
              </Link>
              <Link className={secondaryCta} href="/contact">
                Contact
              </Link>
            </div>
          </Card>
        )}
      </section>

      </div>

      <ScrollToTopButton />
    </PublicLayout>
  );
}
