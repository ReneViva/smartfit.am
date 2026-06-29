import type { CustomerMembershipHistoryItem } from "../../lib/admin/customer-membership-history";

function displayDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function CustomerMembershipHistory({
  events,
}: {
  events: CustomerMembershipHistoryItem[];
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Membership / package history
          </p>
          <h3 className="mt-1 text-2xl font-bold text-foreground">
            Membership and service changes
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
            Readable audit trail for manual membership edits, service-line
            changes, and session corrections. Legacy package records remain
            visible below.
          </p>
        </div>
        <span className="rounded-full bg-soft-blue px-3 py-1.5 text-sm font-bold text-primary-active">
          {events.length} recent event{events.length === 1 ? "" : "s"}
        </span>
      </div>

      {events.length ? (
        <ol className="mt-5 divide-y divide-border rounded-xl border border-border bg-page">
          {events.map((event, index) => (
            <li
              className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5"
              key={`${event.occurredAt.toISOString()}-${index}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-wide text-primary-active">
                  {event.typeLabel}
                </p>
                <h4 className="mt-1 break-words text-lg font-bold text-foreground">
                  {event.targetLabel}
                </h4>
                <p className="mt-1 break-words text-sm leading-6 text-secondary">
                  {event.changeSummary}
                </p>
                <ul className="mt-3 grid gap-2 text-sm text-foreground sm:grid-cols-2">
                  {event.changes.map((change) => (
                    <li
                      className="rounded-lg bg-card px-3 py-2"
                      key={change}
                    >
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-sm font-semibold text-secondary sm:text-right">
                <time>{displayDateTime(event.occurredAt)}</time>
                <p className="mt-1 text-xs text-muted">By {event.actorName}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8">
          <p className="font-semibold text-foreground">
            No stored membership change events yet.
          </p>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Older changes may not be available before history tracking was
            enabled. New membership and service edits will appear here.
          </p>
        </div>
      )}

      <p className="mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm leading-6 text-secondary">
        Older changes may not be available before history tracking was enabled.
      </p>
    </section>
  );
}
