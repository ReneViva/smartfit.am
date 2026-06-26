import Link from "next/link";

import { Card } from "../../components/ui/card";
import { db } from "../../lib/db";

const quickLinks = [
  {
    description: "Gym details, public app visibility, and occupancy thresholds.",
    href: "/admin/settings",
    label: "Settings",
  },
  {
    description: "Homepage offers, news, announcements, and hero content.",
    href: "/admin/content",
    label: "Public Content",
  },
  {
    description: "Public gym photography, visibility, and display order.",
    href: "/admin/gallery",
    label: "Gallery",
  },
  {
    description: "Public coach profiles and their active status.",
    href: "/admin/coaches",
    label: "Coaches",
  },
  {
    description: "Public package definitions and coach assignment.",
    href: "/admin/packages",
    label: "Packages",
  },
  {
    description: "Member profiles, package assignments, and package history.",
    href: "/admin/customers",
    label: "Customers",
  },
];

export default async function AdminPage() {
  const [
    occupancy,
    activeCoaches,
    activePackages,
    activeContent,
    totalCustomers,
    settings,
  ] = await Promise.all([
      db.occupancyState.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { currentCount: true },
      }),
      db.coach.count({ where: { deletedAt: null, isActive: true } }),
      db.package.count({ where: { deletedAt: null, isActive: true } }),
      db.publicContent.count({ where: { deletedAt: null, isActive: true } }),
      db.customer.count({ where: { deletedAt: null } }),
      db.gymSettings.findFirst({
        select: {
          gymName: true,
          occupancyGreenMax: true,
          occupancyYellowMax: true,
          showInstagramInPublicApp: true,
          showLocationInPublicApp: true,
          showMotivationalTextInPublicApp: true,
          showPhoneInPublicApp: true,
          showTelegramInPublicLinks: true,
          showWhatsappInPublicApp: true,
        },
      }),
    ]);

  const publicAppFeatures = settings
    ? [
        settings.showPhoneInPublicApp,
        settings.showWhatsappInPublicApp,
        settings.showInstagramInPublicApp,
        settings.showLocationInPublicApp,
        settings.showTelegramInPublicLinks,
        settings.showMotivationalTextInPublicApp,
      ].filter(Boolean).length
    : 0;
  const thresholdsConfigured =
    Boolean(settings) &&
    settings?.occupancyGreenMax !== null &&
    settings?.occupancyYellowMax !== null;
  const metrics = [
    {
      detail: "People currently inside",
      label: "Current occupancy",
      value: Math.max(0, occupancy?.currentCount ?? 0),
    },
    {
      detail: "Visible public profiles",
      label: "Active coaches",
      value: activeCoaches,
    },
    {
      detail: "Visible public packages",
      label: "Active packages",
      value: activePackages,
    },
    {
      detail: "Active homepage items",
      label: "Active public content",
      value: activeContent,
    },
    {
      detail: "Member profiles",
      label: "Customers",
      value: totalCustomers,
    },
  ];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Overview
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Smartfit.am dashboard
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-secondary">
            A quick view of the public website, live monitor, and current gym
            management content.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          href="/our-app"
          rel="noreferrer"
          target="_blank"
        >
          Open public live monitor
        </Link>
      </header>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm font-semibold text-secondary">
              {metric.label}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-foreground">
              {metric.value}
            </p>
            <p className="mt-2 text-sm text-secondary">{metric.detail}</p>
          </Card>
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
            Quick links
          </p>
          <h3 className="mt-2 text-2xl font-bold text-foreground">
            Manage Smartfit.am
          </h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {quickLinks.map((link) => (
              <Link
                className="rounded-xl border border-border bg-page p-4 transition-colors hover:border-brand hover:bg-soft-blue"
                href={link.href}
                key={link.href}
              >
                <span className="font-bold text-foreground">{link.label}</span>
                <span className="mt-2 block text-sm leading-6 text-secondary">
                  {link.description}
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="bg-soft-blue">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-active">
            Public app status
          </p>
          <h3 className="mt-2 text-2xl font-bold text-foreground">
            {settings ? settings.gymName : "Settings needed"}
          </h3>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-secondary">Public features enabled</dt>
              <dd className="font-bold text-foreground">
                {publicAppFeatures} / 6
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-secondary">Occupancy thresholds</dt>
              <dd className="font-bold text-foreground">
                {thresholdsConfigured ? "Configured" : "Needs setup"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-secondary">Live monitor</dt>
              <dd className="font-bold text-foreground">Public</dd>
            </div>
          </dl>
          <Link
            className="mt-6 inline-flex font-semibold text-primary-active hover:text-primary-hover"
            href="/admin/settings"
          >
            Review public app settings
          </Link>
        </Card>
      </section>
    </>
  );
}
