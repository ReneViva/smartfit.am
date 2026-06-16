import type { getVisitAnalytics } from "../../lib/analytics/data";
import { AggregateBarChart } from "../analytics/aggregate-bar-chart";
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

export function PublicAnalytics({
  analytics,
}: {
  analytics: PublicAnalyticsData | null;
}) {
  if (!analytics) {
    return (
      <Card className="mt-6 text-center">
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
    <section className="mt-10" aria-labelledby="public-analytics-title">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Aggregate activity
        </p>
        <h2
          className="mt-2 text-3xl font-bold text-foreground"
          id="public-analytics-title"
        >
          Plan around the week
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-secondary">
          Based on aggregate check-in activity using the application
          server&apos;s local day and week boundaries.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {summaries.map((summary) => (
          <Card key={summary.label}>
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

      <div className="mt-6">
        <AggregateBarChart
          data={analytics.weeklyCheckIns.map((day) => ({
            isPeak: day.isPeak,
            label: day.label,
            value: day.count,
          }))}
          description={`Aggregate check-ins for ${analytics.weekLabel}.`}
          emptyMessage="There is not enough check-in activity to show a weekly trend yet."
          eyebrow="Weekly trend"
          title="Check-ins by day"
          valueLabel="visits"
        />
      </div>
    </section>
  );
}
