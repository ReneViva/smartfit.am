import Link from "next/link";

import type { CustomerVisitHistoryItem } from "../../lib/admin/customer-visit-history";
import { Card } from "../ui/card";
import { StatusBadge } from "../ui/status-badge";

function displayDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function displayDuration(start: Date, end: Date | null) {
  const endTime = end?.getTime() ?? Date.now();
  const minutes = Math.max(
    0,
    Math.floor((endTime - start.getTime()) / 60_000),
  );
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

function packageUsageText(usage: CustomerVisitHistoryItem["packageUsages"][number]) {
  const guestText = usage.guestPassesDeducted
    ? `, ${usage.guestPassesDeducted} guest pass${usage.guestPassesDeducted === 1 ? "" : "es"}`
    : "";

  return `${usage.packageName}: ${usage.sessionsDeducted} session${usage.sessionsDeducted === 1 ? "" : "s"}${guestText}`;
}

export function CustomerVisitHistory({
  description = "Latest check-in and check-out activity for this customer.",
  id = "customer-visits",
  title = "Recent Visits",
  viewAllHref,
  visits,
}: {
  description?: string;
  id?: string;
  title?: string;
  viewAllHref?: string;
  visits: CustomerVisitHistoryItem[];
}) {
  return (
    <Card className="scroll-mt-6 p-5 sm:p-6" id={id}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Check-in / check-out history
          </p>
          <h3 className="mt-1 text-2xl font-bold text-foreground">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-secondary">
            {description}
          </p>
        </div>
        {viewAllHref && visits.length ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-hover"
            href={viewAllHref}
          >
            View all visits
          </Link>
        ) : null}
      </div>

      {visits.length ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {visits.map((visit) => {
            const isOpen = !visit.checkedOutAt;

            return (
              <article
                className="rounded-xl border border-border bg-page p-4"
                key={visit.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {displayDateTime(visit.checkedInAt)}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary-active">
                      Duration {displayDuration(visit.checkedInAt, visit.checkedOutAt)}
                    </p>
                  </div>
                  <StatusBadge
                    className="text-xs"
                    status={isOpen ? "inGym" : "notInGym"}
                  >
                    {isOpen ? "Open" : "Closed"}
                  </StatusBadge>
                </div>

                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="font-semibold text-secondary">Check-in</dt>
                    <dd className="mt-1 text-foreground">
                      {displayDateTime(visit.checkedInAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-secondary">Check-out</dt>
                    <dd className="mt-1 text-foreground">
                      {visit.checkedOutAt
                        ? displayDateTime(visit.checkedOutAt)
                        : "Not checked out yet"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-secondary">
                      Party / guests
                    </dt>
                    <dd className="mt-1 text-foreground">
                      Party size {visit.occupancyDelta}; guests{" "}
                      {visit.guestCountUsed}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-secondary">
                    Packages used
                  </p>
                  {visit.packageUsages.length ? (
                    <ul className="mt-2 space-y-2 text-sm text-foreground">
                      {visit.packageUsages.map((usage, index) => (
                        <li
                          className="rounded-lg bg-card px-3 py-2"
                          key={`${visit.id}-${usage.packageName}-${index}`}
                        >
                          {packageUsageText(usage)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 rounded-lg border border-dashed border-border bg-card px-3 py-2 text-sm text-secondary">
                      No package usage recorded.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center text-sm text-secondary">
          No visits are recorded for this customer yet.
        </p>
      )}
    </Card>
  );
}
