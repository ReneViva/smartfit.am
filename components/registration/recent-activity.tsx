import type { CustomerRecentActivityItem } from "../../lib/registration/recent-activity";

const activityLabels: Record<CustomerRecentActivityItem["type"], string> = {
  CHECK_IN: "Checked in",
  CHECK_OUT: "Checked out",
  NOTE_ADDED: "Note added",
  NOTE_DELETED: "Note deleted",
  NOTE_EDITED: "Note edited",
  SESSION_CORRECTED: "Session corrected",
  SESSION_DEDUCTED: "Session deducted",
};

function displayDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function RecentActivity({
  activity,
}: {
  activity: CustomerRecentActivityItem[];
}) {
  return (
    <section className="smooth-panel rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
          Read-only customer context
        </p>
        <h3 className="mt-1 text-2xl font-bold text-foreground">
          Recent activity
        </h3>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-secondary">
          Latest customer-specific check-ins, check-outs, session changes, and
          note updates. Full audit logs remain admin-only.
        </p>
      </div>

      {activity.length ? (
        <ol className="mt-5 divide-y divide-border border-y border-border">
          {activity.map((item, index) => (
            <li
              className="animate-list-item-in grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-5"
              key={`${item.type}-${item.occurredAt.toISOString()}-${index}`}
            >
              <div className="min-w-0">
                <p className="font-bold text-foreground">
                  {activityLabels[item.type]}
                </p>
                <p className="mt-1 break-words text-sm leading-6 text-secondary">
                  {item.description}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">
                  By {item.actorName}
                </p>
              </div>
              <time className="text-sm font-semibold text-secondary">
                {displayDateTime(item.occurredAt)}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <div className="animate-panel-in smooth-panel mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8">
          <p className="font-semibold text-foreground">
            No recent customer activity yet.
          </p>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Check-ins, check-outs, session changes, and note updates will
            appear here.
          </p>
        </div>
      )}
    </section>
  );
}
