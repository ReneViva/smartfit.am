import { PublicLayout } from "../../components/layout/public-layout";
import { SmartfitLogo } from "../../components/brand/smartfit-logo";
import { JsonLd } from "../../components/public/json-ld";
import { PublicAnalytics } from "../../components/public/public-analytics";
import { Card } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { getPublicVisitAnalytics } from "../../lib/analytics/data";
import {
  getPublicAppData,
  type PublicCrowdStatus,
} from "../../lib/public-data";
import {
  createBreadcrumbJsonLd,
  createPublicMetadata,
} from "../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicMetadata({
  description:
    "Check Smartfit.am live gym occupancy, public contact links, and add the public app to your device home screen.",
  path: "/our-app",
  title: "Smartfit.am Our App - Live Gym Occupancy & Add to Home Screen",
});

const OUR_APP_HERO_IMAGE =
  "/images/danielle-cerullo-CQfNt66ttZM-unsplash.jpg";
const OUR_APP_DEVICE_IMAGE =
  "/images/84b59626-2c9e-4420-8269-8e34e607bfdc_z2kw5u.avif";

const occupancyCircleClasses: Record<PublicCrowdStatus, string> = {
  high: "bg-status-high text-white",
  low: "bg-status-low text-white",
  medium: "bg-status-medium text-foreground",
};

const publicLinkClasses =
  "group flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-4 text-center font-semibold text-foreground shadow-sm transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const iconClasses =
  "size-7 fill-none stroke-current stroke-[1.8] transition-transform group-hover:scale-105";

const installSteps = [
  {
    items: [
      "Open Smartfit.am in Safari.",
      "Tap Share.",
      "Tap Add to Home Screen.",
    ],
    title: "iPhone and Safari",
  },
  {
    items: [
      "Open Smartfit.am in Chrome.",
      "Tap the menu.",
      "Tap Add to home screen or Install app.",
    ],
    title: "Android and Chrome",
  },
];

function PhoneIcon() {
  return (
    <svg aria-hidden="true" className={iconClasses} viewBox="0 0 24 24">
      <path
        d="M7.4 3.5 10 7.4 8.3 9.2a15.8 15.8 0 0 0 6.5 6.5l1.8-1.7 3.9 2.6v3.1c0 .7-.6 1.3-1.3 1.3A16.2 16.2 0 0 1 3 4.8c0-.7.6-1.3 1.3-1.3h3.1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" className={iconClasses} viewBox="0 0 24 24">
      <path
        d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.2a8.5 8.5 0 1 1 15.6-4.6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.3 7.8c.2 3.8 2.1 5.7 5.9 5.9l1.2-1.3 2.1 1.3c-.4 1.4-1.3 2.1-2.7 2.1-4.1-.2-6.4-2.5-6.6-6.6 0-.7 0-1.1.1-1.4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" className={iconClasses} viewBox="0 0 24 24">
      <rect height="17" rx="5" width="17" x="3.5" y="3.5" />
      <circle cx="12" cy="12" r="4" />
      <circle className="fill-current stroke-none" cx="17.5" cy="6.8" r="1" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" className={iconClasses} viewBox="0 0 24 24">
      <path
        d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default async function OurAppPage() {
  const appData = await getPublicAppData();
  const publicAnalytics = appData.showPublicAnalytics
    ? await getPublicVisitAnalytics()
    : null;
  const { occupancy } = appData;
  const hasPublicLinks = Object.values(appData.links).some(Boolean);
  const occupancyClasses = occupancy.crowdStatus
    ? occupancyCircleClasses[occupancy.crowdStatus]
    : "bg-white/10 text-white";

  return (
    <PublicLayout fullWidth>
      <JsonLd data={createBreadcrumbJsonLd("Our App", "/our-app")} />

      <section className="home-full-bleed relative isolate overflow-hidden bg-black text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${OUR_APP_HERO_IMAGE}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/55 to-[#061521]"
        />
        <div className="home-wide-rail relative grid min-h-[82svh] gap-8 py-28 sm:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.42fr)] lg:items-end">
          <div className="max-w-4xl">
            <div className="public-header-over-hero inline-block">
              <SmartfitLogo
                alt={`${appData.gymName} logo`}
                className="max-h-20 max-w-56 object-contain"
                darkSrc={appData.ourAppLogoDarkUrl ?? undefined}
                lightSrc={appData.ourAppLogoLightUrl ?? undefined}
              />
            </div>
            <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-white/75">
              Live gym status
            </p>
            <h1 className="mt-4 text-5xl font-bold text-white sm:text-7xl">
              Plan your visit before you leave
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-xl sm:leading-8">
              Check how busy {appData.gymName} is, open the fastest contact
              links, and keep the public app one tap away.
            </p>
          </div>

          <div className="rounded-lg border border-white/15 bg-white/10 p-5 text-center shadow-2xl shadow-black/25 backdrop-blur sm:p-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/65">
              Right now
            </p>
            <div
              aria-label={`Current occupancy: ${occupancy.currentCount} people`}
              aria-live="polite"
              className={`mx-auto mt-5 flex size-44 flex-col items-center justify-center rounded-full shadow-2xl shadow-black/20 ${occupancyClasses}`}
            >
              <span className="text-7xl font-bold leading-none">
                {occupancy.currentCount}
              </span>
              <span className="mt-2 text-sm font-semibold uppercase tracking-wide">
                people inside
              </span>
            </div>

            <StatusBadge
              className="mt-6 border-white/20 bg-white/10 text-white"
              status={occupancy.crowdStatus ?? "notInGym"}
            >
              {occupancy.crowdLabel}
            </StatusBadge>

            {!occupancy.available ? (
              <p className="mt-5 text-sm leading-6 text-white/70">
                Live occupancy is temporarily unavailable. A safe zero fallback
                is shown.
              </p>
            ) : !occupancy.thresholdsAvailable ? (
              <p className="mt-5 text-sm leading-6 text-white/70">
                Crowd status is unavailable until occupancy thresholds are set.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="home-wide-rail relative z-10 -mt-10 grid gap-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <Card className="rounded-lg p-6 sm:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
            Visit smarter
          </p>
          <h2 className="mt-2 text-3xl font-bold text-foreground">
            Live status, public links, and quick directions in one place
          </h2>
          <p className="mt-4 text-sm leading-6 text-secondary">
            The public app is built for planning: see the current crowd level,
            choose a quieter hour, then get straight to the right contact or
            location link.
          </p>
          {appData.motivationalText ? (
            <p className="mt-5 rounded-lg border border-brand/25 bg-soft-blue px-4 py-3 text-sm font-bold leading-6 text-primary-active">
              {appData.motivationalText}
            </p>
          ) : null}
        </Card>

        {hasPublicLinks || appData.location?.address ? (
          <Card className="rounded-lg p-6 sm:p-7">
            {hasPublicLinks ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                      Quick links
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-foreground">
                      Reach Smartfit.am fast
                    </h2>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {appData.links.phone ? (
                    <a
                      aria-label={`Call ${appData.gymName}`}
                      className={publicLinkClasses}
                      href={appData.links.phone.href}
                      title={`Call ${appData.links.phone.label}`}
                    >
                      <PhoneIcon />
                      <span>Call</span>
                    </a>
                  ) : null}
                  {appData.links.whatsapp ? (
                    <a
                      aria-label={`Open ${appData.gymName} on WhatsApp`}
                      className={publicLinkClasses}
                      href={appData.links.whatsapp}
                      rel="noreferrer"
                      target="_blank"
                      title="Open WhatsApp"
                    >
                      <WhatsAppIcon />
                      <span>WhatsApp</span>
                    </a>
                  ) : null}
                  {appData.links.instagram ? (
                    <a
                      aria-label={`Open ${appData.gymName} on Instagram`}
                      className={publicLinkClasses}
                      href={appData.links.instagram}
                      rel="noreferrer"
                      target="_blank"
                      title="Open Instagram"
                    >
                      <InstagramIcon />
                      <span>Instagram</span>
                    </a>
                  ) : null}
                  {appData.links.location ? (
                    <a
                      aria-label={`Get directions to ${appData.gymName}`}
                      className={publicLinkClasses}
                      href={appData.links.location.href}
                      rel="noreferrer"
                      target="_blank"
                      title="Open directions"
                    >
                      <LocationIcon />
                      <span>Directions</span>
                    </a>
                  ) : null}
                </div>
              </>
            ) : null}

            {appData.location?.address ? (
              <div
                className={`max-w-xl ${hasPublicLinks ? "mt-6 border-t border-border pt-5" : ""}`}
              >
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                  Location
                </p>
                <p className="mt-2 [overflow-wrap:anywhere] text-sm leading-6 text-secondary">
                  {appData.location.address}
                </p>
              </div>
            ) : null}
          </Card>
        ) : null}
      </section>

      {appData.showPublicAnalytics ? (
        <section className="home-wide-rail py-12 sm:py-16">
          <PublicAnalytics analytics={publicAnalytics} />
        </section>
      ) : null}

      <section className="home-full-bleed overflow-hidden bg-[#05070a] py-12 text-white sm:py-16 lg:py-20">
        <div className="home-wide-rail grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
          <div className="relative min-h-80 overflow-hidden rounded-lg border border-white/15 bg-white/10 shadow-2xl shadow-black/25">
            <img
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover object-center"
              loading="lazy"
              src={OUR_APP_DEVICE_IMAGE}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                One tap away
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                Add Smartfit.am to your home screen
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {installSteps.map((step) => (
              <article
                className="rounded-lg border border-white/15 bg-white/10 p-6 shadow-xl shadow-black/20 backdrop-blur"
                key={step.title}
              >
                <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-white/75">
                  {step.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      {appData.location?.mapEmbedUrl ? (
        <section className="home-wide-rail py-12 sm:py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                Location
              </p>
              <h2 className="mt-2 text-4xl font-bold text-foreground">
                Find us
              </h2>
            </div>
            {appData.location?.address ? (
              <p className="max-w-xl [overflow-wrap:anywhere] text-sm leading-6 text-secondary">
                {appData.location.address}
              </p>
            ) : null}
          </div>
          <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <iframe
              allowFullScreen
              className="block h-[270px] w-full border-0 sm:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={appData.location.mapEmbedUrl}
              title={`${appData.gymName} map`}
            />
          </div>
        </section>
      ) : null}

      {!appData.settingsAvailable ? (
        <p className="home-wide-rail pb-10 text-center text-sm leading-6 text-secondary">
          Public gym settings are temporarily unavailable. Smartfit.am fallback
          content is shown.
        </p>
      ) : null}
    </PublicLayout>
  );
}
