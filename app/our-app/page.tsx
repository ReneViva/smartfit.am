import { PublicLayout } from "../../components/layout/public-layout";
import { SmartfitLogo } from "../../components/brand/smartfit-logo";
import { Card } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import {
  getPublicAppData,
  type PublicCrowdStatus,
} from "../../lib/public-data";

export const dynamic = "force-dynamic";

const occupancyCircleClasses: Record<PublicCrowdStatus, string> = {
  high: "bg-status-high text-white",
  low: "bg-status-low text-white",
  medium: "bg-status-medium text-foreground",
};

const publicLinkClasses =
  "group flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-neutral px-3 py-4 text-center font-semibold text-foreground transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const iconClasses =
  "size-7 fill-none stroke-current stroke-[1.8] transition-transform group-hover:scale-105";

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
  const { occupancy } = appData;
  const hasPublicLinks = Object.values(appData.links).some(Boolean);
  const occupancyClasses = occupancy.crowdStatus
    ? occupancyCircleClasses[occupancy.crowdStatus]
    : "bg-neutral text-secondary";

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          {appData.logoUrl ? (
            <img
              alt={`${appData.gymName} logo`}
              className="mx-auto max-h-20 max-w-56 object-contain"
              src={appData.logoUrl}
            />
          ) : (
            <SmartfitLogo className="mx-auto max-h-20 max-w-56 object-contain" />
          )}
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Live gym status
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Plan your visit
          </h1>
          <p className="mt-4 leading-7 text-secondary">
            Check how busy {appData.gymName} is before you head out.
          </p>
        </header>

        <Card className="mt-8 text-center">
          <div
            aria-label={`Current occupancy: ${occupancy.currentCount} people`}
            aria-live="polite"
            className={`mx-auto flex size-44 flex-col items-center justify-center rounded-full ${occupancyClasses}`}
          >
            <span className="text-7xl font-bold leading-none">
              {occupancy.currentCount}
            </span>
            <span className="mt-2 text-sm font-semibold uppercase tracking-wide">
              people inside
            </span>
          </div>

          <StatusBadge
            className="mt-6"
            status={occupancy.crowdStatus ?? "notInGym"}
          >
            {occupancy.crowdLabel}
          </StatusBadge>

          {!occupancy.available ? (
            <p className="mt-5 text-sm leading-6 text-secondary">
              Live occupancy is temporarily unavailable. A safe zero fallback
              is shown.
            </p>
          ) : !occupancy.thresholdsAvailable ? (
            <p className="mt-5 text-sm leading-6 text-secondary">
              Crowd status is unavailable until occupancy thresholds are set.
            </p>
          ) : null}
        </Card>

        {appData.motivationalText ? (
          <Card className="mt-6 bg-soft-blue text-center">
            <p className="text-lg font-semibold leading-7 text-foreground">
              {appData.motivationalText}
            </p>
          </Card>
        ) : null}

        {hasPublicLinks || appData.location?.address ? (
          <Card className="mt-6">
            {hasPublicLinks ? (
              <>
                <h2 className="text-2xl font-bold text-foreground">
                  Quick links
                </h2>
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
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">
                  Location
                </p>
                <p className="mt-2 [overflow-wrap:anywhere] text-sm leading-6 text-secondary">
                  {appData.location.address}
                </p>
              </div>
            ) : null}
          </Card>
        ) : null}

        <section className="mt-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              Add to Home Screen
            </p>
            <h2 className="mt-2 text-3xl font-bold text-foreground">
              Keep Smartfit.am one tap away
            </h2>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Card>
              <h3 className="text-xl font-bold text-foreground">
                iPhone and Safari
              </h3>
              <ol className="mt-4 list-decimal space-y-3 pl-5 leading-6 text-secondary">
                <li>Open Smartfit.am in Safari.</li>
                <li>Tap Share.</li>
                <li>Tap Add to Home Screen.</li>
              </ol>
            </Card>

            <Card>
              <h3 className="text-xl font-bold text-foreground">
                Android and Chrome
              </h3>
              <ol className="mt-4 list-decimal space-y-3 pl-5 leading-6 text-secondary">
                <li>Open Smartfit.am in Chrome.</li>
                <li>Tap the menu.</li>
                <li>Tap Add to home screen or Install app.</li>
              </ol>
            </Card>
          </div>
        </section>

        {appData.location?.mapEmbedUrl ? (
          <section className="mt-10">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                Location
              </p>
              <h2 className="mt-2 text-3xl font-bold text-foreground">
                Find us
              </h2>
            </div>
            <Card className="mt-6 overflow-hidden p-0">
              <iframe
                allowFullScreen
                className="block h-[270px] w-full border-0 sm:h-[360px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={appData.location.mapEmbedUrl}
                title={`${appData.gymName} map`}
              />
            </Card>
          </section>
        ) : null}

        {!appData.settingsAvailable ? (
          <p className="mt-8 text-center text-sm leading-6 text-secondary">
            Public gym settings are temporarily unavailable. Smartfit.am
            fallback content is shown.
          </p>
        ) : null}
      </div>
    </PublicLayout>
  );
}
