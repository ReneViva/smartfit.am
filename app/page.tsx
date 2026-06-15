import Link from "next/link";

import { PublicLayout } from "../components/layout/public-layout";
import { EmptyState } from "../components/public/empty-state";
import { GalleryGrid } from "../components/public/gallery-grid";
import { PublicContentCarousel } from "../components/public/public-content-carousel";
import { PublicContentImage } from "../components/public/public-content-image";
import { Card } from "../components/ui/card";
import { packageTypeLabel } from "../lib/package-types";
import {
  getActiveCoaches,
  getActiveGalleryImages,
  getActivePackages,
  getActivePublicContent,
  getPublicAppData,
  getPublicSettings,
} from "../lib/public-data";

export const dynamic = "force-dynamic";

const primaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const secondaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

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
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 leading-7 text-secondary">{description}</p>
      </div>
      {action ? (
        <Link className={secondaryCta} href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </div>
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
  const heroContent = content.find((item) => item.type === "HERO");
  const offers = content.filter((item) => item.type !== "HERO");
  const occupancyStatusClasses = {
    high: "border-status-high text-status-high",
    low: "border-status-low text-status-low",
    medium: "border-status-medium text-foreground",
  } as const;

  return (
    <PublicLayout>
      <section className="public-section-enter">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">
              Current at {gymName}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Offers worth moving for
            </h1>
          </div>
          <Link className={secondaryCta} href="/contact">
            Contact
          </Link>
        </div>

        {offers.length ? (
          <PublicContentCarousel items={offers} />
        ) : (
          <div className="mt-6">
            <EmptyState>
              New offers and announcements will appear here.
            </EmptyState>
          </div>
        )}
      </section>

      <section className="public-section-enter mt-14 grid items-center gap-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">
            Move. Train. Feel stronger.
          </p>
          <h2 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-foreground sm:text-6xl">
            {heroContent?.title ?? `${gymName}, built for stronger days`}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
            {heroContent?.body ??
              "Focused training spaces, flexible services, and real-time crowd information make it easier to build a routine that lasts."}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className={primaryCta} href="/packages">
              View packages
            </Link>
            <Link className={secondaryCta} href="/our-app">
              Check crowd
            </Link>
            <Link className={secondaryCta} href="/contact">
              Contact
            </Link>
          </div>
        </div>

        {heroContent?.imageUrl ? (
          <div className="public-image-card overflow-hidden rounded-2xl border border-border bg-soft-blue">
            <PublicContentImage
              alt={heroContent.title}
              className="aspect-[4/3] w-full"
              eager
              src={heroContent.imageUrl}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="public-interactive-card">
              <p className="text-sm font-semibold text-secondary">
                Live occupancy
              </p>
              <p className="mt-2 text-4xl font-bold text-foreground">
                {appData.occupancy.currentCount}
              </p>
              <p className="mt-2 text-sm font-semibold text-brand">
                {appData.occupancy.crowdLabel}
              </p>
            </Card>
            <Card className="public-interactive-card">
              <p className="text-sm font-semibold text-secondary">
                Active options
              </p>
              <p className="mt-2 text-4xl font-bold text-foreground">
                {packages.length}
              </p>
              <p className="mt-2 text-sm text-secondary">
                Package and service previews
              </p>
            </Card>
            <Card className="public-interactive-card">
              <p className="text-sm font-semibold text-secondary">
                Coaching
              </p>
              <p className="mt-2 text-4xl font-bold text-foreground">
                {coaches.length}
              </p>
              <p className="mt-2 text-sm text-secondary">
                Active coach previews
              </p>
            </Card>
          </div>
        )}
      </section>

      <section className="public-section-enter mt-16">
        <SectionHeading
          action={{ href: "/packages", label: "Explore all packages" }}
          description="Choose gym access, training, swimming, cardio, and other active services that fit your routine."
          eyebrow="Packages and services"
          title="Find your way to move"
        />
        {packages.length ? (
          <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((gymPackage) => (
              <Card
                className="public-interactive-card flex flex-col"
                key={gymPackage.id}
              >
                <p className="w-fit rounded-full bg-soft-blue px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-active">
                  {packageTypeLabel(gymPackage.packageType)}
                </p>
                <h3 className="mt-5 text-2xl font-bold text-foreground">
                  {gymPackage.name}
                </h3>
                <p className="mt-4 text-3xl font-bold text-brand">
                  {gymPackage.price}
                </p>
                <p className="mt-1 text-sm text-secondary">
                  {gymPackage.sessionCount} sessions
                </p>
                {gymPackage.description ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-secondary">
                    {gymPackage.description}
                  </p>
                ) : null}
                <Link
                  className="mt-auto pt-6 font-bold text-brand hover:text-primary-hover"
                  href="/packages"
                >
                  View details
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-7">
            <EmptyState>Package information will be available soon.</EmptyState>
          </div>
        )}
      </section>

      <section className="public-section-enter mt-16">
        <SectionHeading
          action={{ href: "/coaches", label: "Meet all coaches" }}
          description="Train with focused guidance from active Smartfit.am coaches."
          eyebrow="Professional guidance"
          title="Coaches who keep progress practical"
        />
        {coaches.length ? (
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach) => (
              <article
                className="public-interactive-card overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                key={coach.id}
              >
                {coach.photoUrl ? (
                  <div className="public-image-card overflow-hidden">
                    <PublicContentImage
                      alt={`${coach.firstName} ${coach.lastName}`}
                      className="aspect-[4/3] w-full"
                      src={coach.photoUrl}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-soft-blue text-5xl font-bold text-brand">
                    {coach.firstName.charAt(0)}
                    {coach.lastName.charAt(0)}
                  </div>
                )}
                <div className="p-6">
                  <p className="text-sm font-bold text-brand">
                    {coach.specialty}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-foreground">
                    {coach.firstName} {coach.lastName}
                  </h3>
                  {coach.description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary">
                      {coach.description}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7">
            <EmptyState>Coach profiles will be available soon.</EmptyState>
          </div>
        )}
      </section>

      <section className="public-section-enter mt-16">
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

      <section className="public-section-enter mt-16 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="flex flex-col justify-between bg-soft-blue">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary-active">
              Our App
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground">
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

        <Card className="flex items-center gap-6">
          <div
            className={`flex size-32 shrink-0 flex-col items-center justify-center rounded-full border-4 bg-card ${
              appData.occupancy.crowdStatus
                ? occupancyStatusClasses[appData.occupancy.crowdStatus]
                : "border-border text-foreground"
            }`}
          >
            <span className="text-5xl font-bold leading-none">
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

      <section className="public-section-enter mt-16">
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
    </PublicLayout>
  );
}
