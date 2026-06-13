import { PublicLayout } from "../../components/layout/public-layout";
import { PageIntro } from "../../components/public/page-intro";
import { Card } from "../../components/ui/card";
import { getPublicSettings } from "../../lib/public-data";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getPublicSettings();

  return (
    <PublicLayout>
      <PageIntro
        description="Find the available contact, location, and working-hours information for Smartfit.am."
        eyebrow="Contact"
        title="Let’s connect"
      />

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-foreground">Contact details</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-foreground">Phone</dt>
              <dd className="mt-1 text-secondary">
                {settings?.contactNumber ?? "Not available yet"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Address</dt>
              <dd className="mt-1 text-secondary">
                {settings?.address ?? "Not available yet"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Working days</dt>
              <dd className="mt-1 text-secondary">
                {settings?.workingDays ?? "Not available yet"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Working hours</dt>
              <dd className="mt-1 text-secondary">
                {settings?.workingHours ?? "Not available yet"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-foreground">Public links</h2>
          <div className="mt-5 flex flex-col gap-3">
            {settings?.whatsappLink ? (
              <a
                className="rounded-lg bg-neutral px-4 py-3 font-semibold text-foreground hover:bg-neutral-hover"
                href={settings.whatsappLink}
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>
            ) : null}
            {settings?.instagramLink ? (
              <a
                className="rounded-lg bg-neutral px-4 py-3 font-semibold text-foreground hover:bg-neutral-hover"
                href={settings.instagramLink}
                rel="noreferrer"
                target="_blank"
              >
                Instagram
              </a>
            ) : null}
            {settings?.mapLink ? (
              <a
                className="rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-primary-hover"
                href={settings.mapLink}
                rel="noreferrer"
                target="_blank"
              >
                Open map
              </a>
            ) : null}
            {!settings?.whatsappLink &&
            !settings?.instagramLink &&
            !settings?.mapLink ? (
              <p className="text-sm leading-6 text-secondary">
                Public contact links will be available soon.
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    </PublicLayout>
  );
}
