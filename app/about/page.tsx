import Link from "next/link";

import { PublicLayout } from "../../components/layout/public-layout";
import { JsonLd } from "../../components/public/json-ld";
import { PageIntro } from "../../components/public/page-intro";
import { Card } from "../../components/ui/card";
import { getPublicSettings } from "../../lib/public-data";
import {
  createBreadcrumbJsonLd,
  createPublicMetadata,
} from "../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicMetadata({
  description:
    "Learn about Smartfit.am's training atmosphere, gym services, and practical approach to building a consistent fitness routine.",
  path: "/about",
  title: "About Smartfit.am — Gym, Training Atmosphere & Services",
});

export default async function AboutPage() {
  const settings = await getPublicSettings();
  const gymName = settings?.gymName ?? "Smartfit.am";

  return (
    <PublicLayout>
      <JsonLd data={createBreadcrumbJsonLd("About", "/about")} />

      <PageIntro
        description={`${gymName} is a welcoming place for focused training, steady progress, and a healthier daily routine.`}
        eyebrow="About us"
        title="Built for better training days"
      />

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <Card>
          <h2 className="text-xl font-bold text-foreground">A clear purpose</h2>
          <p className="mt-3 text-sm leading-6 text-secondary">
            We keep the gym experience practical and approachable, so members
            can focus on showing up and doing the work.
          </p>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-foreground">
            A supportive atmosphere
          </h2>
          <p className="mt-3 text-sm leading-6 text-secondary">
            Smartfit.am is designed for consistent training, whether you are
            starting fresh or building on years of experience.
          </p>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-foreground">Room to progress</h2>
          <p className="mt-3 text-sm leading-6 text-secondary">
            Flexible packages and professional coaches help members choose a
            path that matches their goals.
          </p>
        </Card>
      </section>

      <Card className="mt-10 flex flex-wrap items-center justify-between gap-5">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            See what Smartfit.am offers
          </h2>
          <p className="mt-2 text-secondary">
            Explore packages, meet the coaches, or get in touch.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            href="/packages"
          >
            Packages
          </Link>
          <Link
            className="rounded-lg bg-neutral px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-hover"
            href="/contact"
          >
            Contact
          </Link>
        </div>
      </Card>
    </PublicLayout>
  );
}
