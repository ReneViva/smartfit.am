import Link from "next/link";

import { PublicLayout } from "../../components/layout/public-layout";
import { JsonLd } from "../../components/public/json-ld";
import {
  getPublicAppData,
  getPublicSettings,
} from "../../lib/public-data";
import {
  createBreadcrumbJsonLd,
  createPublicMetadata,
} from "../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicMetadata({
  description:
    "Find Smartfit.am contact details, address, working hours, phone, WhatsApp, Instagram, and map directions when available.",
  path: "/contact",
  title: "Contact Smartfit.am - Address, Working Hours, Phone & WhatsApp",
});

const CONTACT_HERO_IMAGE =
  "/images/victor-freitas-WvDYdXDzkhs-unsplash.jpg";
const CONTACT_VISIT_IMAGE = "/images/young-fitness-man-studio.jpg";

const primaryCta =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const darkCta =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-sm backdrop-blur transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function phoneHref(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const dialable = value.replace(/[^\d+*#,;]/g, "");

  return dialable ? `tel:${dialable}` : null;
}

function ContactAction({
  description,
  href,
  label,
  strong = false,
}: {
  description: string;
  href?: string | null;
  label: string;
  strong?: boolean;
}) {
  const classes = `public-interactive-card block min-h-36 rounded-lg border p-5 shadow-sm transition-[border-color,box-shadow,transform] ${
    strong
      ? "border-brand bg-[#061521] text-white"
      : "border-border bg-card text-foreground"
  }`;
  const content = (
    <>
      <span
        className={`text-xs font-bold uppercase tracking-[0.16em] ${
          strong ? "text-brand" : "text-brand"
        }`}
      >
        {label}
      </span>
      <span
        className={`mt-4 block text-sm leading-6 ${
          strong ? "text-white/70" : "text-secondary"
        }`}
      >
        {description}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        className={classes}
        href={href}
        rel={href.startsWith("tel:") ? undefined : "noreferrer"}
        target={href.startsWith("tel:") ? undefined : "_blank"}
      >
        {content}
      </a>
    );
  }

  return <div className={classes}>{content}</div>;
}

export default async function ContactPage() {
  const [settings, appData] = await Promise.all([
    getPublicSettings(),
    getPublicAppData(),
  ]);
  const gymName = settings?.gymName ?? appData.gymName;
  const callHref = phoneHref(settings?.contactNumber);
  const hasAnyPublicContact =
    Boolean(settings?.contactNumber) ||
    Boolean(settings?.address) ||
    Boolean(settings?.workingDays) ||
    Boolean(settings?.workingHours) ||
    Boolean(settings?.whatsappLink) ||
    Boolean(settings?.instagramLink) ||
    Boolean(settings?.mapLink);

  return (
    <PublicLayout fullWidth>
      <JsonLd data={createBreadcrumbJsonLd("Contact", "/contact")} />

      <section className="home-full-bleed relative isolate flex min-h-[82svh] items-center overflow-hidden bg-black text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${CONTACT_HERO_IMAGE}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/82 via-black/56 to-[#061521]/95"
        />
        <div className="home-wide-rail relative py-28 text-center sm:py-32">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
            Contact
          </p>
          <h1 className="mx-auto mt-3 max-w-5xl text-4xl font-bold text-white sm:text-6xl lg:text-7xl">
            Visit {gymName}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/80 sm:text-xl sm:leading-8">
            Find available contact, location, and working-hours information
            before your next training day.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link className={primaryCta} href="/packages">
              View packages
            </Link>
            <Link className={darkCta} href="/our-app">
              Check crowd
            </Link>
          </div>
        </div>
      </section>

      <section className="home-wide-rail py-12 sm:py-16">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
              Contact methods
            </p>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-5xl">
              Choose the fastest way to reach the gym
            </h2>
          </div>
          {!hasAnyPublicContact ? (
            <p className="max-w-md rounded-lg border border-border bg-card px-4 py-3 text-sm leading-6 text-secondary">
              Contact details can be updated from Admin settings.
            </p>
          ) : null}
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ContactAction
            description={settings?.contactNumber ?? "Not available yet"}
            href={callHref}
            label="Phone"
            strong={Boolean(callHref)}
          />
          <ContactAction
            description={
              settings?.whatsappLink
                ? "Open WhatsApp"
                : "WhatsApp link is not available yet"
            }
            href={settings?.whatsappLink}
            label="WhatsApp"
          />
          <ContactAction
            description={
              settings?.instagramLink
                ? "Open Instagram"
                : "Instagram link is not available yet"
            }
            href={settings?.instagramLink}
            label="Instagram"
          />
          <ContactAction
            description={
              settings?.mapLink ? "Open directions" : "Map link is not available yet"
            }
            href={settings?.mapLink}
            label="Directions"
            strong={Boolean(settings?.mapLink)}
          />
        </div>
      </section>

      <section className="home-full-bleed overflow-hidden bg-[#05070a] py-12 text-white sm:py-16 lg:py-20">
        <div className="home-wide-rail grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] lg:items-stretch">
          <div className="rounded-lg border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/25 backdrop-blur sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
              Visit details
            </p>
            <dl className="mt-6 space-y-5 text-sm">
              <div>
                <dt className="font-bold uppercase tracking-[0.12em] text-white/55">
                  Address
                </dt>
                <dd className="mt-1 [overflow-wrap:anywhere] text-base font-semibold leading-7 text-white">
                  {settings?.address ?? "Not available yet"}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-[0.12em] text-white/55">
                  Working days
                </dt>
                <dd className="mt-1 text-base font-semibold leading-7 text-white">
                  {settings?.workingDays ?? "Not available yet"}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-[0.12em] text-white/55">
                  Working hours
                </dt>
                <dd className="mt-1 text-base font-semibold leading-7 text-white">
                  {settings?.workingHours ?? "Not available yet"}
                </dd>
              </div>
            </dl>
          </div>

          {appData.location?.mapEmbedUrl ? (
            <div className="overflow-hidden rounded-lg border border-white/15 bg-black shadow-2xl shadow-black/30">
              <iframe
                allowFullScreen
                className="block h-[320px] w-full border-0 lg:h-full lg:min-h-[30rem]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={appData.location.mapEmbedUrl}
                title={`${gymName} map`}
              />
            </div>
          ) : (
            <div className="relative min-h-80 overflow-hidden rounded-lg border border-white/15 bg-black shadow-2xl shadow-black/30 lg:min-h-[30rem]">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url("${CONTACT_VISIT_IMAGE}")` }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                  Location
                </p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
                  Map embed can be enabled from public location settings when
                  available.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="home-full-bleed bg-page py-12 sm:py-16">
        <div className="home-wide-rail flex flex-col gap-6 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand sm:text-sm">
              Before you arrive
            </p>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-5xl">
              Compare packages or check the live crowd
            </h2>
            <p className="mt-3 text-sm leading-6 text-secondary sm:text-base sm:leading-7">
              The public pages show gym-wide information only and keep private
              member records out of view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className={primaryCta} href="/packages">
              Packages
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-neutral px-5 py-2.5 text-sm font-bold text-foreground transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              href="/gallery"
            >
              Gallery
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-neutral px-5 py-2.5 text-sm font-bold text-foreground transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              href="/our-app"
            >
              Our App
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
