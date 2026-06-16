import { AggregateBarChart } from "../../../components/analytics/aggregate-bar-chart";
import { AnalyticsCards } from "../../../components/admin/analytics-cards";
import { PeakHoursTable } from "../../../components/admin/peak-hours-table";
import { Card } from "../../../components/ui/card";
import { getBasicAnalytics } from "../../../lib/admin/analytics-data";

export const dynamic = "force-dynamic";

function displayDateTime(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value)
    : "No occupancy update recorded";
}

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

export default async function AnalyticsPage() {
  const analytics = await getBasicAnalytics();
  const weeklyPeakDay = peakSummary(analytics.weeklyCheckIns);
  const weeklyPeakHour = peakSummary(analytics.weeklyPeakHours);

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Operational analytics
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Gym activity
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Current occupancy and aggregate check-in activity for{" "}
          {analytics.todayLabel}. Daily and weekly boundaries use the
          application server&apos;s local time.
        </p>
      </header>

      <section className="mt-8">
        <AnalyticsCards
          currentOccupancy={analytics.currentOccupancy}
          todayCheckIns={analytics.todayCheckIns}
          todayHourlyCheckIns={analytics.todayHourlyCheckIns}
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <AggregateBarChart
          data={analytics.weeklyCheckIns.map((day) => ({
            isPeak: day.isPeak,
            label: day.label,
            value: day.count,
          }))}
          description={`Check-ins grouped by server-local day for ${analytics.weekLabel}.`}
          emptyMessage="No check-ins have been recorded for the current server-local week."
          eyebrow="Weekly check-in trend"
          title="Activity by day"
          valueLabel="visits"
        />

        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
            Weekly peaks
          </p>
          <h3 className="mt-2 text-2xl font-bold text-foreground">
            Busiest check-in patterns
          </h3>
          <dl className="mt-6 space-y-5">
            <div className="rounded-xl bg-neutral p-4">
              <dt className="text-sm font-semibold text-secondary">Peak day</dt>
              <dd className="mt-2 break-words text-xl font-bold text-foreground">
                {weeklyPeakDay.label}
              </dd>
              <dd className="mt-1 text-sm text-secondary">
                {weeklyPeakDay.count} check-in
                {weeklyPeakDay.count === 1 ? "" : "s"}
              </dd>
            </div>
            <div className="rounded-xl bg-neutral p-4">
              <dt className="text-sm font-semibold text-secondary">
                Peak hour
              </dt>
              <dd className="mt-2 break-words text-xl font-bold text-foreground">
                {weeklyPeakHour.label}
              </dd>
              <dd className="mt-1 text-sm text-secondary">
                {weeklyPeakHour.count} check-in
                {weeklyPeakHour.count === 1 ? "" : "s"}
              </dd>
            </div>
            <div className="rounded-xl bg-soft-blue p-4">
              <dt className="text-sm font-semibold text-secondary">
                Weekly total
              </dt>
              <dd className="mt-2 text-3xl font-bold text-foreground">
                {analytics.weeklyTotalCheckIns}
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <PeakHoursTable hours={analytics.todayHourlyCheckIns} />
        <AggregateBarChart
          data={analytics.occupancyTrend.map((day) => ({
            hasData: day.hasData,
            isPeak: day.isPeak,
            label: day.label,
            value: day.count,
          }))}
          description="Highest occupancy count recorded after an occupancy event on each server-local day."
          emptyMessage="There are not enough recorded occupancy events to show a historical trend."
          eyebrow="Historical occupancy"
          title="Recorded daily peaks"
          valueLabel="people"
        />
      </section>

      <Card className="mt-8 bg-soft-blue">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-active">
          Calculation notes
        </p>
        <dl className="mt-5 grid gap-5 text-sm md:grid-cols-3">
          <div>
            <dt className="font-semibold text-secondary">Date boundaries</dt>
            <dd className="mt-1 text-foreground">
              Server-local days; the week starts Monday
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-secondary">Check-in trends</dt>
            <dd className="mt-1 text-foreground">
              Counted from aggregate visit check-in timestamps
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-secondary">
              Occupancy last updated
            </dt>
            <dd className="mt-1 text-foreground">
              {displayDateTime(analytics.occupancyUpdatedAt)}
            </dd>
          </div>
        </dl>
      </Card>
    </>
  );
}
