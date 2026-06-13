import Link from "next/link";

import { PublicLayout } from "../components/layout/public-layout";
import { EmptyState } from "../components/public/empty-state";
import { Card } from "../components/ui/card";
import {
  getActiveCoaches,
  getActivePackages,
  getActivePublicContent,
  getPublicSettings,
} from "../lib/public-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, content, coaches, packages] = await Promise.all([
    getPublicSettings(),
    getActivePublicContent(),
    getActiveCoaches(3),
    getActivePackages(3),
  ]);
  const gymName = settings?.gymName ?? "Smartfit.am";
  const heroContent = content.find((item) => item.type === "HERO");
  const latestContent = content.filter((item) => item.type !== "HERO").slice(0, 3);

  return (
    <PublicLayout>
      <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Move. Train. Feel stronger.
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            {heroContent?.title ?? `Welcome to ${gymName}`}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
            {heroContent?.body ??
              "A focused, welcoming place to train, build healthy habits, and keep moving toward your goals."}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              href="/packages"
            >
              Explore packages
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-hover"
              href="/our-app"
            >
              Open Our App
            </Link>
          </div>
        </div>

        <Card className="bg-soft-blue">
          <p className="text-sm font-semibold text-primary-active">
            Plan your visit
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Smartfit.am on your phone
          </h2>
          <p className="mt-3 leading-7 text-secondary">
            The Our App experience makes live occupancy and useful gym
            information easy to reach before your visit.
          </p>
          <Link
            className="mt-5 inline-flex font-semibold text-brand hover:text-primary-hover"
            href="/our-app"
          >
            Go to Our App
          </Link>
        </Card>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              Latest
            </p>
            <h2 className="mt-2 text-3xl font-bold text-foreground">
              Offers and announcements
            </h2>
          </div>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {latestContent.length ? (
            latestContent.map((item) => (
              <Card key={item.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {item.type.toLowerCase().replaceAll("_", " ")}
                </p>
                <h3 className="mt-2 text-xl font-bold text-foreground">
                  {item.title}
                </h3>
                {item.body ? (
                  <p className="mt-3 text-sm leading-6 text-secondary">
                    {item.body}
                  </p>
                ) : null}
              </Card>
            ))
          ) : (
            <div className="md:col-span-3">
              <EmptyState>
                New offers and announcements will appear here.
              </EmptyState>
            </div>
          )}
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-brand">Packages</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            Find your training fit
          </h2>
          <p className="mt-3 text-sm leading-6 text-secondary">
            {packages.length
              ? `${packages.length} active package preview${packages.length === 1 ? "" : "s"} available.`
              : "Package information will be available soon."}
          </p>
          <Link
            className="mt-5 inline-flex font-semibold text-brand hover:text-primary-hover"
            href="/packages"
          >
            View packages
          </Link>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-brand">Coaches</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            Train with guidance
          </h2>
          <p className="mt-3 text-sm leading-6 text-secondary">
            {coaches.length
              ? `Meet ${coaches.length} active coach${coaches.length === 1 ? "" : "es"} in our preview.`
              : "Coach profiles will be available soon."}
          </p>
          <Link
            className="mt-5 inline-flex font-semibold text-brand hover:text-primary-hover"
            href="/coaches"
          >
            Meet the coaches
          </Link>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-brand">Visit us</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">
            Ready when you are
          </h2>
          <p className="mt-3 text-sm leading-6 text-secondary">
            {settings?.address ??
              "Contact and location details will be available soon."}
          </p>
          <Link
            className="mt-5 inline-flex font-semibold text-brand hover:text-primary-hover"
            href="/contact"
          >
            Contact Smartfit.am
          </Link>
        </Card>
      </section>
    </PublicLayout>
  );
}
