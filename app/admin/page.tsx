import Link from "next/link";

import {
  AdminIcon,
  type AdminIconName,
} from "../../components/admin/admin-icons";
import { Card } from "../../components/ui/card";
import { getBasicAnalytics } from "../../lib/admin/analytics-data";
import { requireStaffRole } from "../../lib/auth";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";

type DashboardTone = "amber" | "blue" | "cyan" | "green" | "pink" | "violet";

const statToneClasses: Record<
  DashboardTone,
  { icon: string; ring: string; text: string }
> = {
  amber: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    ring: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-300",
  },
  blue: {
    icon: "bg-brand/10 text-primary-active dark:text-brand",
    ring: "bg-brand",
    text: "text-primary-active dark:text-brand",
  },
  cyan: {
    icon: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
    ring: "bg-cyan-500",
    text: "text-cyan-600 dark:text-cyan-300",
  },
  green: {
    icon: "bg-status-active/10 text-status-active",
    ring: "bg-status-active",
    text: "text-status-active",
  },
  pink: {
    icon: "bg-pink-500/10 text-pink-600 dark:text-pink-300",
    ring: "bg-pink-500",
    text: "text-pink-600 dark:text-pink-300",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    ring: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-300",
  },
};

const quickActions: {
  href: string;
  icon: AdminIconName;
  label: string;
  supportingText: string;
  tone: DashboardTone;
}[] = [
  {
    href: "/admin/coaches",
    icon: "coaches",
    label: "Coaches",
    supportingText: "Manage profiles",
    tone: "cyan",
  },
  {
    href: "/admin/packages",
    icon: "packages",
    label: "Packages",
    supportingText: "Manage public offers",
    tone: "violet",
  },
  {
    href: "/admin/content",
    icon: "content",
    label: "Public Content",
    supportingText: "Homepage items",
    tone: "pink",
  },
  {
    href: "/admin/customers",
    icon: "customers",
    label: "Customers",
    supportingText: "Member records",
    tone: "amber",
  },
  {
    href: "/our-app",
    icon: "monitor",
    label: "Our App",
    supportingText: "Live monitor",
    tone: "green",
  },
  {
    href: "/admin/analytics",
    icon: "analytics",
    label: "Analytics",
    supportingText: "Activity trends",
    tone: "blue",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function relativeTime(value: Date) {
  const diffMs = Date.now() - value.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);

  return `${days}d ago`;
}

function actionLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (first) => first.toUpperCase());
}

function featureCount(settings: {
  showInstagramInPublicApp: boolean;
  showLocationInPublicApp: boolean;
  showMotivationalTextInPublicApp: boolean;
  showPhoneInPublicApp: boolean;
  showTelegramInPublicLinks: boolean;
  showWhatsappInPublicApp: boolean;
} | null) {
  return settings
    ? [
        settings.showPhoneInPublicApp,
        settings.showWhatsappInPublicApp,
        settings.showInstagramInPublicApp,
        settings.showLocationInPublicApp,
        settings.showTelegramInPublicLinks,
        settings.showMotivationalTextInPublicApp,
      ].filter(Boolean).length
    : 0;
}

function occupancyStatus(
  currentOccupancy: number,
  settings: {
    occupancyGreenMax: number | null;
    occupancyYellowMax: number | null;
  } | null,
) {
  if (
    !settings ||
    settings.occupancyGreenMax === null ||
    settings.occupancyYellowMax === null
  ) {
    return {
      label: "Thresholds need setup",
      tone: "text-button-warning",
    };
  }

  if (currentOccupancy <= settings.occupancyGreenMax) {
    return { label: "Low crowd", tone: "text-status-active" };
  }

  if (currentOccupancy <= settings.occupancyYellowMax) {
    return { label: "Moderate crowd", tone: "text-button-warning" };
  }

  return { label: "High crowd", tone: "text-button-danger" };
}

function StatCard({
  detail,
  icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: AdminIconName;
  label: string;
  tone: DashboardTone;
  value: number;
}) {
  const classes = statToneClasses[tone];

  return (
    <Card className="smooth-card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${classes.icon}`}>
          <AdminIcon className="size-5" name={icon} />
        </span>
        <span className={`mt-1 h-2 w-2 rounded-full ${classes.ring}`} />
      </div>
      <p className="mt-4 text-sm font-semibold text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        {formatNumber(value)}
      </p>
      <p className="mt-2 text-sm leading-6 text-secondary">{detail}</p>
    </Card>
  );
}

function CompactBars({
  emptyMessage,
  items,
  valueLabel,
}: {
  emptyMessage: string;
  items: { hasData?: boolean; isPeak?: boolean; label: string; value: number }[];
  valueLabel: string;
}) {
  const hasData = items.some((item) => item.hasData ?? item.value > 0);
  const maximum = Math.max(1, ...items.map((item) => item.value));

  if (!hasData) {
    return (
      <p className="mt-5 rounded-xl border border-dashed border-border bg-page px-4 py-8 text-center text-sm text-secondary">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {items.map((item) => (
        <div
          className="grid min-w-0 grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3"
          key={item.label}
        >
          <span className="truncate text-sm font-semibold text-secondary">
            {item.label}
          </span>
          <div className="h-2.5 min-w-0 overflow-hidden rounded-full bg-neutral">
            <div
              className={`h-full rounded-full ${
                item.isPeak ? "bg-brand" : "bg-status-active"
              }`}
              style={{ width: `${(item.value / maximum) * 100}%` }}
            />
          </div>
          <span className="min-w-14 text-right text-xs font-bold text-foreground">
            {item.hasData === false ? "-" : `${item.value} ${valueLabel}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminPage() {
  await requireStaffRole("ADMIN");

  const [
    analytics,
    activeCoaches,
    activePackages,
    activeContent,
    totalCustomers,
    activeServiceLines,
    settings,
    recentLogs,
  ] = await Promise.all([
    getBasicAnalytics(),
    db.coach.count({ where: { deletedAt: null, isActive: true } }),
    db.package.count({ where: { deletedAt: null, isActive: true } }),
    db.publicContent.count({ where: { deletedAt: null, isActive: true } }),
    db.customer.count({ where: { deletedAt: null } }),
    db.customerPackageService.count({
      where: { deletedAt: null, isActive: true },
    }),
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
    db.auditLog.findMany({
      select: {
        actionType: true,
        createdAt: true,
        id: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const publicAppFeatureCount = featureCount(settings);
  const thresholdsConfigured =
    Boolean(settings) &&
    settings?.occupancyGreenMax !== null &&
    settings?.occupancyYellowMax !== null;
  const crowdStatus = occupancyStatus(analytics.currentOccupancy, settings);
  const stats = [
    {
      detail: crowdStatus.label,
      icon: "monitor" as const,
      label: "Current Occupancy",
      tone: "blue" as const,
      value: analytics.currentOccupancy,
    },
    {
      detail: "Visible on public profiles",
      icon: "coaches" as const,
      label: "Active Coaches",
      tone: "cyan" as const,
      value: activeCoaches,
    },
    {
      detail: "Visible package templates",
      icon: "packages" as const,
      label: "Active Packages",
      tone: "violet" as const,
      value: activePackages,
    },
    {
      detail: "Member profiles",
      icon: "customers" as const,
      label: "Customers",
      tone: "amber" as const,
      value: totalCustomers,
    },
    {
      detail: "Active homepage items",
      icon: "content" as const,
      label: "Public Content",
      tone: "pink" as const,
      value: activeContent,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-soft-blue p-0">
        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-active">
              Overview
            </p>
            <h2 className="mt-2 break-words text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Smartfit.am Dashboard
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-secondary sm:text-base">
              Real-time overview of your gym, members, and public presence.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/20 transition-colors hover:bg-primary-hover sm:w-auto"
            href="/our-app"
            rel="noreferrer"
            target="_blank"
          >
            <AdminIcon className="size-4" name="monitor" />
            Open Live Monitor
          </Link>
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard
            detail={stat.detail}
            icon={stat.icon}
            key={stat.label}
            label={stat.label}
            tone={stat.tone}
            value={stat.value}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                Occupancy Overview
              </p>
              <h3 className="mt-2 text-2xl font-bold text-foreground">
                Recorded daily peaks
              </h3>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Highest occupancy count recorded after occupancy events this
                week.
              </p>
            </div>
            <span className={`rounded-full bg-page px-3 py-1 text-sm font-bold ${crowdStatus.tone}`}>
              {formatNumber(analytics.currentOccupancy)} now
            </span>
          </div>
          <CompactBars
            emptyMessage="There are not enough occupancy events to show a weekly trend."
            items={analytics.occupancyTrend.map((day) => ({
              hasData: day.hasData,
              isPeak: day.isPeak,
              label: day.label,
              value: day.count,
            }))}
            valueLabel="people"
          />
        </Card>

        <Card>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
            Quick Actions
          </p>
          <h3 className="mt-2 text-2xl font-bold text-foreground">
            Manage Smartfit.am
          </h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {quickActions.map((action) => {
              const tone = statToneClasses[action.tone];

              return (
                <Link
                  className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-page px-4 py-3 transition-colors hover:border-brand hover:bg-soft-blue"
                  href={action.href}
                  key={action.href}
                  rel={action.href === "/our-app" ? "noreferrer" : undefined}
                  target={action.href === "/our-app" ? "_blank" : undefined}
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone.icon}`}>
                    <AdminIcon className="size-5" name={action.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-foreground">
                      {action.label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-semibold text-secondary">
                      {action.supportingText}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(18rem,0.85fr)]">
        <Card>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
            Weekly Check-ins
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-4xl font-bold tracking-tight text-foreground">
                {formatNumber(analytics.weeklyTotalCheckIns)}
              </p>
              <p className="mt-1 text-sm text-secondary">
                Total for {analytics.weekLabel}
              </p>
            </div>
            <Link
              className="text-sm font-bold text-primary-active hover:text-primary-hover"
              href="/admin/analytics"
            >
              View analytics
            </Link>
          </div>
          <CompactBars
            emptyMessage="No check-ins have been recorded for the current week."
            items={analytics.weeklyCheckIns.map((day) => ({
              isPeak: day.isPeak,
              label: day.label,
              value: day.count,
            }))}
            valueLabel="visits"
          />
        </Card>

        <Card>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
            Membership Services
          </p>
          <h3 className="mt-2 text-2xl font-bold text-foreground">
            Weekly service usage
          </h3>
          <p className="mt-2 text-sm leading-6 text-secondary">
            {formatNumber(analytics.serviceDeductions.totalSessionsUsed)}{" "}
            service session
            {analytics.serviceDeductions.totalSessionsUsed === 1 ? "" : "s"}{" "}
            deducted this week. {formatNumber(activeServiceLines)} active
            service line{activeServiceLines === 1 ? "" : "s"} exist now.
          </p>
          {analytics.serviceDeductions.topServices.length ? (
            <div className="mt-5 space-y-3">
              {analytics.serviceDeductions.topServices.map((service) => (
                <div
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-page px-4 py-3"
                  key={service.label}
                >
                  <span className="min-w-0 truncate text-sm font-bold text-foreground">
                    {service.label}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-secondary">
                    {service.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-border bg-page px-4 py-8 text-center text-sm text-secondary">
              No service-line deductions have been recorded this week.
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                Public App Status
              </p>
              <h3 className="mt-2 text-2xl font-bold text-foreground">
                {settings?.gymName ?? "Smartfit.am"}
              </h3>
              <p className="mt-1 text-sm text-secondary">Public app</p>
            </div>
            <span className="rounded-full bg-status-active/10 px-3 py-1 text-xs font-bold text-status-active">
              Public
            </span>
          </div>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-secondary">Public features</dt>
              <dd className="font-bold text-status-active">
                {publicAppFeatureCount} / 6 enabled
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
              <dd className="font-bold text-foreground">Available</dd>
            </div>
          </dl>
          <Link
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
            href="/admin/settings"
          >
            Review public app settings
          </Link>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                Today&apos;s Check-ins
              </p>
              <h3 className="mt-2 text-2xl font-bold text-foreground">
                Hourly activity
              </h3>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Visits grouped by server-local hour for {analytics.todayLabel}.
              </p>
            </div>
            <span className="rounded-full bg-page px-3 py-1 text-sm font-bold text-primary-active">
              {formatNumber(analytics.todayCheckIns)} today
            </span>
          </div>
          <CompactBars
            emptyMessage="No check-ins have been recorded today."
            items={analytics.todayHourlyCheckIns.map((hour) => ({
              isPeak: hour.isPeak,
              label: hour.label,
              value: hour.count,
            }))}
            valueLabel="visits"
          />
        </Card>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                Recent Activity
              </p>
              <h3 className="mt-2 text-2xl font-bold text-foreground">
                Latest admin logs
              </h3>
            </div>
            <Link
              className="rounded-full bg-page px-3 py-1 text-sm font-bold text-primary-active hover:text-primary-hover"
              href="/admin/logs"
            >
              View all
            </Link>
          </div>
          {recentLogs.length ? (
            <div className="mt-5 divide-y divide-border">
              {recentLogs.map((log) => (
                <div
                  className="flex min-w-0 gap-3 py-3 first:pt-0 last:pb-0"
                  key={log.id}
                >
                  <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-xl bg-soft-blue text-primary-active">
                    <AdminIcon className="size-4" name="logs" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="break-words text-sm font-bold text-foreground">
                        {actionLabel(log.actionType)}
                      </p>
                      <span className="text-xs font-semibold text-muted">
                        {relativeTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-secondary">
                      Recorded in the admin audit log.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-border bg-page px-4 py-8 text-center text-sm text-secondary">
              No audit activity has been recorded yet.
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
