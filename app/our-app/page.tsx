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
  "flex min-h-12 items-center justify-between rounded-xl bg-neutral px-4 py-3 font-semibold text-foreground transition-colors hover:bg-neutral-hover";

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

        {hasPublicLinks ? (
          <Card className="mt-6">
            <h2 className="text-2xl font-bold text-foreground">Quick links</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {appData.links.phone ? (
                <a
                  className={publicLinkClasses}
                  href={appData.links.phone.href}
                >
                  <span>Call us</span>
                  <span className="text-sm text-secondary">
                    {appData.links.phone.label}
                  </span>
                </a>
              ) : null}
              {appData.links.whatsapp ? (
                <a
                  className={publicLinkClasses}
                  href={appData.links.whatsapp}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>WhatsApp</span>
                  <span aria-hidden="true">Open</span>
                </a>
              ) : null}
              {appData.links.instagram ? (
                <a
                  className={publicLinkClasses}
                  href={appData.links.instagram}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>Instagram</span>
                  <span aria-hidden="true">Open</span>
                </a>
              ) : null}
              {appData.links.location ? (
                <a
                  className={publicLinkClasses}
                  href={appData.links.location.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>Location</span>
                  <span className="text-sm text-secondary">
                    {appData.links.location.label}
                  </span>
                </a>
              ) : null}
            </div>
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
