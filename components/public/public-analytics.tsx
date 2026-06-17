import type { getVisitAnalytics } from "../../lib/analytics/data";
import { Card } from "../ui/card";

type PublicAnalyticsData = Awaited<ReturnType<typeof getVisitAnalytics>>;

function peakSummary(
  values: { count: number; isPeak: boolean; label: string }[],
) {
  const peaks = values.filter((value) => value.isPeak);

  return {
    count: peaks[0]?.count ?? 0,
    label: peaks.length
      ? peaks.map((value) => value.label).join(", ")
      : "No check-ins yet",
  };
}

function PublicWeeklyBarChart({ analytics }: { analytics: PublicAnalyticsData }) {
  const data = analytics.weeklyCheckIns;
  const hasData = data.some((point) => point.count > 0);
  const maximum = Math.max(1, ...data.map((point) => point.count));

  return (
    <Card className="rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
            Weekly trend
          </p>
          <h3 className="mt-2 text-3xl font-bold text-foreground">
            Check-ins by day
          </h3>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Aggregate check-ins for {analytics.weekLabel}.
          </p>
        </div>
        <p className="w-fit rounded-full border border-border bg-page px-4 py-2 text-sm font-bold text-foreground">
          {analytics.weeklyTotalCheckIns} total
        </p>
      </div>

      {hasData ? (
        <div
          aria-label={`Check-ins by day. Aggregate check-ins for ${analytics.weekLabel}.`}
          className="mt-7"
          role="img"
        >
          <div className="grid min-h-72 grid-cols-7 items-end gap-2 rounded-lg border border-border bg-page px-3 pb-4 pt-6 sm:gap-3 sm:px-5">
            {data.map((point) => {
              const height = Math.max(7, (point.count / maximum) * 100);

              return (
                <div
                  className="flex min-h-60 min-w-0 flex-col justify-end"
                  key={point.label}
                >
                  <span className="mb-2 min-h-5 truncate text-center text-xs font-bold text-foreground">
                    {point.count}
                  </span>
                  <div className="flex h-44 min-w-0 items-end border-b border-border">
                    <div
                      aria-hidden="true"
                      className={`mx-auto w-full max-w-11 rounded-t-lg shadow-sm transition-[height] ${
                        point.isPeak
                          ? "bg-brand shadow-brand/20"
                          : "bg-status-active shadow-status-active/20"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="mt-3 truncate text-center text-xs font-bold uppercase tracking-wide text-secondary">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-7 rounded-lg border border-dashed border-border bg-page px-5 py-10 text-center text-sm leading-6 text-secondary">
          There is not enough check-in activity to show a weekly trend yet.
        </p>
      )}
    </Card>
  );
}

export function PublicAnalytics({
  analytics,
}: {
  analytics: PublicAnalyticsData | null;
}) {
  if (!analytics) {
    return (
      <Card className="rounded-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
          Gym activity
        </p>
        <h2 className="mt-2 text-2xl font-bold text-foreground">
          Analytics are temporarily unavailable
        </h2>
        <p className="mt-3 text-sm leading-6 text-secondary">
          Live occupancy above remains available when its source is healthy.
        </p>
      </Card>
    );
  }

  const todayPeak = peakSummary(analytics.todayHourlyCheckIns);
  const weeklyPeakDay = peakSummary(analytics.weeklyCheckIns);
  const weeklyPeakHour = peakSummary(analytics.weeklyPeakHours);
  const summaries = [
    {
      detail: analytics.todayLabel,
      label: "Today's check-ins",
      value: analytics.todayCheckIns.toString(),
    },
    {
      detail: `${todayPeak.count} check-in${todayPeak.count === 1 ? "" : "s"}`,
      label: "Today's peak hour",
      value: todayPeak.label,
    },
    {
      detail: `${weeklyPeakDay.count} check-in${weeklyPeakDay.count === 1 ? "" : "s"}`,
      label: "Peak day this week",
      value: weeklyPeakDay.label,
    },
    {
      detail: `${weeklyPeakHour.count} check-in${weeklyPeakHour.count === 1 ? "" : "s"}`,
      label: "Peak hour this week",
      value: weeklyPeakHour.label,
    },
  ];

  return (
    <section aria-labelledby="public-analytics-title">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">
          Aggregate activity
        </p>
        <h2
          className="mt-2 text-4xl font-bold text-foreground sm:text-5xl"
          id="public-analytics-title"
        >
          Plan around the week
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-secondary">
          Based on aggregate check-in activity using the application
          server&apos;s local day and week boundaries.
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaries.map((summary) => (
          <Card className="rounded-lg p-5" key={summary.label}>
            <p className="text-sm font-semibold text-secondary">
              {summary.label}
            </p>
            <p className="mt-3 break-words text-2xl font-bold text-foreground">
              {summary.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-secondary">
              {summary.detail}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-5">
        <PublicWeeklyBarChart analytics={analytics} />
      </div>
    </section>
  );
}
