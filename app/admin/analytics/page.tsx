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

export default async function AnalyticsPage() {
  const analytics = await getBasicAnalytics();

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Basic analytics
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Gym activity today
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Current occupancy and check-in activity for {analytics.todayLabel}.
          Daily boundaries and hour groups use the application server&apos;s
          local time.
        </p>
      </header>

      <section className="mt-8">
        <AnalyticsCards
          currentOccupancy={analytics.currentOccupancy}
          peakHours={analytics.peakHours}
          todayCheckIns={analytics.todayCheckIns}
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <PeakHoursTable hours={analytics.peakHours} />
        <Card className="h-fit bg-soft-blue">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-active">
            Calculation notes
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-secondary">Date range</dt>
              <dd className="mt-1 text-foreground">
                Today only, using server-local midnight boundaries
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-secondary">Peak hours</dt>
              <dd className="mt-1 text-foreground">
                Counted from visit check-in time, grouped by hour
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
      </section>
    </>
  );
}
