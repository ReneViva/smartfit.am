import type { HourlyCheckIns } from "../../lib/analytics/basic";
import { Card } from "../ui/card";

export function PeakHoursTable({ hours }: { hours: HourlyCheckIns[] }) {
  const maximum = Math.max(0, ...hours.map((hour) => hour.count));

  return (
    <Card>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
          Hourly check-ins
        </p>
        <h3 className="mt-2 text-2xl font-bold text-foreground">Peak hours</h3>
        <p className="mt-2 text-sm leading-6 text-secondary">
          Today&apos;s check-ins grouped by the server-local hour in which each
          visit started.
        </p>
      </div>

      {hours.length ? (
        <div className="mt-6 space-y-4">
          {hours.map((hour) => (
            <div
              className={`rounded-xl border p-4 ${
                hour.isPeak
                  ? "border-brand bg-soft-blue"
                  : "border-border bg-page"
              }`}
              key={hour.hour}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-foreground">{hour.label}</p>
                  {hour.isPeak ? (
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary-active">
                      Peak hour
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-secondary">
                  {hour.count} check-in{hour.count === 1 ? "" : "s"}
                </p>
              </div>
              <div
                aria-hidden="true"
                className="mt-3 h-2 overflow-hidden rounded-full bg-neutral"
              >
                <div
                  className={`h-full rounded-full ${
                    hour.isPeak ? "bg-brand" : "bg-status-active"
                  }`}
                  style={{ width: `${(hour.count / maximum) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-page px-5 py-10 text-center text-secondary">
          No check-ins yet for the current server-local day.
        </p>
      )}
    </Card>
  );
}
