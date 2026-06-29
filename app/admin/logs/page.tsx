import { AuditActionType, Prisma } from "@prisma/client";
import Link from "next/link";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import {
  membershipDisplayName,
  serviceLineDisplayName,
} from "../../../lib/customer-memberships";
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

function targetTypeLabel(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  const labels: Record<string, string> = {
    Category: "Category",
    Coach: "Coach",
    Customer: "Customer",
    CustomerDocument: "Customer document",
    CustomerPackage: "Customer membership",
    CustomerPackageService: "Membership service line",
    GalleryImage: "Gallery image",
    GymSettings: "Gym settings",
    GymVisit: "Gym visit",
    Note: "Note",
    OccupancyState: "Occupancy state",
    Package: "Package template",
    PackageFreeze: "Package freeze",
    PublicContent: "Public content",
  };

  return (
    labels[value] ??
    value
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (first) => first.toUpperCase())
  );
}

function targetKey(type: string | null, id: string | null) {
  return type && id ? `${type}:${id}` : null;
}

function targetIds(logs: { targetId: string | null; targetType: string | null }[], type: string) {
  return [
    ...new Set(
      logs
        .filter((log) => log.targetType === type && log.targetId)
        .map((log) => log.targetId as string),
    ),
  ];
}

function setTargetLabel(
  labels: Map<string, string>,
  type: string,
  id: string,
  label: string,
) {
  labels.set(`${type}:${id}`, label);
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
  const [
    targetCustomers,
    targetPackages,
    targetMemberships,
    targetServices,
    targetCoaches,
    targetCategories,
    targetPublicContent,
    targetDocuments,
    targetVisits,
    targetNotes,
    targetFreezes,
    targetGalleryImages,
  ] = await Promise.all([
    db.customer.findMany({
      select: { customerCode: true, fullName: true, id: true },
      where: { id: { in: targetIds(logs, "Customer") } },
    }),
    db.package.findMany({
      select: { id: true, name: true, packageType: true },
      where: { id: { in: targetIds(logs, "Package") } },
    }),
    db.customerPackage.findMany({
      select: {
        customer: { select: { customerCode: true, fullName: true } },
        id: true,
        membershipName: true,
        package: { select: { name: true } },
        status: true,
      },
      where: { id: { in: targetIds(logs, "CustomerPackage") } },
    }),
    db.customerPackageService.findMany({
      select: {
        customerPackage: {
          select: {
            customer: { select: { customerCode: true, fullName: true } },
            membershipName: true,
            package: { select: { name: true } },
          },
        },
        id: true,
        package: { select: { name: true } },
        serviceName: true,
      },
      where: { id: { in: targetIds(logs, "CustomerPackageService") } },
    }),
    db.coach.findMany({
      select: { firstName: true, id: true, lastName: true },
      where: { id: { in: targetIds(logs, "Coach") } },
    }),
    db.category.findMany({
      select: { id: true, name: true },
      where: { id: { in: targetIds(logs, "Category") } },
    }),
    db.publicContent.findMany({
      select: { id: true, title: true, type: true },
      where: { id: { in: targetIds(logs, "PublicContent") } },
    }),
    db.customerDocument.findMany({
      select: {
        customer: { select: { customerCode: true, fullName: true } },
        id: true,
        originalFileName: true,
      },
      where: { id: { in: targetIds(logs, "CustomerDocument") } },
    }),
    db.gymVisit.findMany({
      select: {
        checkedInAt: true,
        customer: { select: { customerCode: true, fullName: true } },
        id: true,
      },
      where: { id: { in: targetIds(logs, "GymVisit") } },
    }),
    db.note.findMany({
      select: {
        content: true,
        customer: { select: { customerCode: true, fullName: true } },
        id: true,
      },
      where: { id: { in: targetIds(logs, "Note") } },
    }),
    db.packageFreeze.findMany({
      select: {
        customerPackage: {
          select: {
            customer: { select: { customerCode: true, fullName: true } },
            membershipName: true,
            package: { select: { name: true } },
          },
        },
        customerPackageService: {
          select: {
            coachName: true,
            package: { select: { name: true } },
            serviceName: true,
          },
        },
        id: true,
        mode: true,
        status: true,
      },
      where: { id: { in: targetIds(logs, "PackageFreeze") } },
    }),
    db.galleryImage.findMany({
      select: { altText: true, id: true, title: true },
      where: { id: { in: targetIds(logs, "GalleryImage") } },
    }),
  ]);
  const targetLabels = new Map<string, string>();

  for (const customer of targetCustomers) {
    setTargetLabel(
      targetLabels,
      "Customer",
      customer.id,
      `${customer.customerCode}: ${customer.fullName}`,
    );
  }

  for (const gymPackage of targetPackages) {
    setTargetLabel(
      targetLabels,
      "Package",
      gymPackage.id,
      `${gymPackage.name} (${gymPackage.packageType})`,
    );
  }

  for (const membership of targetMemberships) {
    setTargetLabel(
      targetLabels,
      "CustomerPackage",
      membership.id,
      `${membership.customer.customerCode}: ${membership.customer.fullName} / ${membershipDisplayName(membership)} (${membership.status})`,
    );
  }

  for (const service of targetServices) {
    setTargetLabel(
      targetLabels,
      "CustomerPackageService",
      service.id,
      `${serviceLineDisplayName(service)} for ${service.customerPackage.customer.customerCode}: ${service.customerPackage.customer.fullName}`,
    );
  }

  for (const coach of targetCoaches) {
    setTargetLabel(
      targetLabels,
      "Coach",
      coach.id,
      `${coach.firstName} ${coach.lastName}`,
    );
  }

  for (const category of targetCategories) {
    setTargetLabel(targetLabels, "Category", category.id, category.name);
  }

  for (const content of targetPublicContent) {
    setTargetLabel(
      targetLabels,
      "PublicContent",
      content.id,
      `${content.title} (${content.type.toLowerCase()})`,
    );
  }

  for (const document of targetDocuments) {
    setTargetLabel(
      targetLabels,
      "CustomerDocument",
      document.id,
      `${document.originalFileName} for ${document.customer.customerCode}: ${document.customer.fullName}`,
    );
  }

  for (const visit of targetVisits) {
    setTargetLabel(
      targetLabels,
      "GymVisit",
      visit.id,
      `${visit.customer.customerCode}: ${visit.customer.fullName} checked in ${displayDateTime(visit.checkedInAt)}`,
    );
  }

  for (const note of targetNotes) {
    setTargetLabel(
      targetLabels,
      "Note",
      note.id,
      `${note.customer ? `${note.customer.customerCode}: ${note.customer.fullName} / ` : ""}${note.content.slice(0, 80)}`,
    );
  }

  for (const freeze of targetFreezes) {
    const targetName = freeze.customerPackageService
      ? `${serviceLineDisplayName(freeze.customerPackageService)} service in ${membershipDisplayName(freeze.customerPackage)}`
      : membershipDisplayName(freeze.customerPackage);

    setTargetLabel(
      targetLabels,
      "PackageFreeze",
      freeze.id,
      `${targetName} for ${freeze.customerPackage.customer.customerCode}: ${freeze.customerPackage.customer.fullName} (${freeze.mode.toLowerCase()} ${freeze.status.toLowerCase()})`,
    );
  }

  for (const image of targetGalleryImages) {
    setTargetLabel(
      targetLabels,
      "GalleryImage",
      image.id,
      image.title ?? image.altText ?? "Gallery image",
    );
  }

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
          <Button
            className="self-end"
            pendingLabel="Applying..."
            type="submit"
          >
            Apply filters
          </Button>
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
              const targetLabel =
                targetLabels.get(targetKey(log.targetType, log.targetId) ?? "") ??
                (log.targetType === "GymSettings"
                  ? "Gym settings"
                  : log.targetType === "OccupancyState"
                    ? "Occupancy state"
                    : null);

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
                        {targetTypeLabel(log.targetType)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-secondary">Target</dt>
                      <dd className="mt-1 break-all text-foreground">
                        {targetLabel ?? log.targetId ?? "Not recorded"}
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
