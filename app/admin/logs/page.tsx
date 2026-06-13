import { AuditActionType, Prisma } from "@prisma/client";
import Link from "next/link";

import { Card } from "../../../components/ui/card";
import { db } from "../../../lib/db";

type LogsPageProps = {
  searchParams: Promise<{
    action?: string;
    q?: string;
  }>;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";

function selectedAction(value: string | undefined) {
  return value &&
    Object.values(AuditActionType).includes(value as AuditActionType)
    ? (value as AuditActionType)
    : null;
}

function displayDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function displayJson(value: Prisma.JsonValue | null) {
  return value === null ? null : JSON.stringify(value, null, 2);
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const action = selectedAction(params.action);
  const query = params.q?.trim().slice(0, 200) ?? "";
  const conditions: Prisma.AuditLogWhereInput[] = [];

  if (action) {
    conditions.push({ actionType: action });
  }

  if (query) {
    conditions.push({
      customer: {
        is: {
          OR: [
            { customerCode: { contains: query, mode: "insensitive" } },
            { fullName: { contains: query, mode: "insensitive" } },
          ],
        },
      },
    });
  }

  const logs = await db.auditLog.findMany({
    include: {
      actor: {
        select: { name: true, username: true },
      },
      customer: {
        select: { customerCode: true, fullName: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    where: conditions.length ? { AND: conditions } : undefined,
  });

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Audit logs
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Operational activity
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Read-only records of important admin and registration actions. The
          latest 100 matching entries are shown.
        </p>
      </header>

      <Card className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-foreground">Filter logs</h3>
            <p className="mt-2 text-sm text-secondary">
              Filter by action or related customer name/member code.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-brand hover:text-primary-hover"
            href="/admin/logs"
          >
            Clear filters
          </Link>
        </div>
        <form className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="block text-sm font-semibold text-foreground">
            Action
            <select
              className={inputClass}
              defaultValue={action ?? ""}
              name="action"
            >
              <option value="">All actions</option>
              {Object.values(AuditActionType).map((value) => (
                <option key={value} value={value}>
                  {value.toLowerCase().replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-foreground">
            Customer
            <input
              className={inputClass}
              defaultValue={query}
              name="q"
              placeholder="Name or member code..."
            />
          </label>
          <button
            className="inline-flex min-h-11 items-center justify-center self-end rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            type="submit"
          >
            Apply filters
          </button>
        </form>
      </Card>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-foreground">Latest logs</h3>
            <p className="mt-1 text-sm text-secondary">
              {logs.length} matching entr{logs.length === 1 ? "y" : "ies"}.
            </p>
          </div>
        </div>

        {logs.length ? (
          <div className="mt-5 space-y-4">
            {logs.map((log) => {
              const oldValue = displayJson(log.oldValue);
              const newValue = displayJson(log.newValue);

              return (
                <Card className="p-5" key={log.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-brand">
                        {log.actionType.toLowerCase().replaceAll("_", " ")}
                      </p>
                      <p className="mt-2 leading-7 text-foreground">
                        {log.description}
                      </p>
                    </div>
                    <time className="text-sm font-semibold text-secondary">
                      {displayDateTime(log.createdAt)}
                    </time>
                  </div>

                  <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <dt className="font-semibold text-secondary">Actor</dt>
                      <dd className="mt-1 text-foreground">
                        {log.actor?.name ??
                          log.actor?.username ??
                          "System / unavailable staff"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-secondary">Customer</dt>
                      <dd className="mt-1 text-foreground">
                        {log.customer
                          ? `${log.customer.customerCode}: ${log.customer.fullName}`
                          : "Not related to a customer"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-secondary">Target type</dt>
                      <dd className="mt-1 break-words text-foreground">
                        {log.targetType ?? "Not recorded"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-secondary">Target ID</dt>
                      <dd className="mt-1 break-all text-foreground">
                        {log.targetId ?? "Not recorded"}
                      </dd>
                    </div>
                  </dl>

                  {oldValue || newValue ? (
                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      {oldValue ? (
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            Previous value
                          </h4>
                          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-page p-4 text-xs leading-5 text-secondary">
                            {oldValue}
                          </pre>
                        </div>
                      ) : null}
                      {newValue ? (
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            New value
                          </h4>
                          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-page p-4 text-xs leading-5 text-secondary">
                            {newValue}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
            No audit logs match the current filters.
          </p>
        )}
      </section>
    </>
  );
}
