import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerForm } from "../../../../components/admin/customer-form";
import { CustomerNotesPanel } from "../../../../components/admin/customer-notes-panel";
import { CustomerPackageAssignmentForm } from "../../../../components/admin/customer-package-assignment-form";
import { CustomerPackageOverview } from "../../../../components/admin/customer-package-overview";
import { CustomerWorkspaceActions } from "../../../../components/admin/customer-workspace-actions";
import { Card } from "../../../../components/ui/card";
import { StatusBadge } from "../../../../components/ui/status-badge";
import { db } from "../../../../lib/db";

type CustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
};

const errorMessages: Record<string, string> = {
  "assignment-unavailable":
    "The package assignment could not be saved. Please try again.",
  "customer-unavailable": "The customer could not be saved. Please try again.",
  "duplicate-code": "That member code is already assigned to another customer.",
  "invalid-assignment":
    "Choose a package and enter valid dates, sessions, guest passes, and status.",
  "invalid-birth-date": "Birth date cannot be in the future.",
  "invalid-coach": "The selected coach is not available.",
  "invalid-customer":
    "Member code, full name, birth date, and a valid status are required.",
  "invalid-date-order": "Expiration date cannot be before activation date.",
  "invalid-freeze-days":
    "Freeze duration must be a positive whole number of days.",
  "invalid-package": "Choose an available package definition.",
  "invalid-package-action": "The package status action is not available.",
  "invalid-package-balance":
    "Remaining sessions and guest passes cannot exceed their initial values.",
  "invalid-package-edit":
    "Enter valid assigned package dates, sessions, guest passes, coach, and status.",
  "package-edit-frozen-status":
    "Use the dedicated freeze/reactivate control to change frozen status.",
  "package-edit-open-visit":
    "This package is being used by an open visit and cannot be edited yet.",
  "package-edit-stale":
    "This package changed before Save. Review the latest values and try again.",
  "package-edit-unavailable":
    "The assigned package could not be updated. Please review it and try again.",
  "package-freeze-unavailable":
    "The package could not be frozen. Please try again.",
  "package-not-freezable":
    "Only an active, unexpired package with remaining sessions can be frozen.",
  "package-not-frozen": "This package is no longer frozen.",
  "package-reactivation-unavailable":
    "The package could not be reactivated. Please try again.",
  "package-status-stale":
    "The package status changed before the action completed. Review it and try again.",
};

const statusMessages: Record<string, string> = {
  "customer-saved": "Customer profile updated.",
  "package-assigned":
    "Package assigned. A new package history record was created.",
  "package-frozen":
    "Package frozen. Its expiration date was extended by the selected duration.",
  "package-reactivated":
    "Package reactivated. Normal eligibility rules continue to apply.",
  "package-reactivated-expired":
    "Package reactivated as expired because its expiration date has passed.",
  "package-updated":
    "Assigned package updated. Previous and new values were logged.",
};

function displayDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(value)
    : "Not provided";
}

function staffName(staff: {
  name: string | null;
  username: string | null;
}) {
  return staff.name ?? staff.username ?? "Staff user";
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const [{ customerId }, query] = await Promise.all([params, searchParams]);
  const [customer, coaches, activePackages, packageDefinitions] =
    await Promise.all([
      db.customer.findFirst({
        include: {
          _count: {
            select: {
              notes: { where: { deletedAt: null } },
            },
          },
          assignedCoach: {
            select: { firstName: true, lastName: true },
          },
          notes: {
            orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
            select: {
              content: true,
              createdAt: true,
              createdBy: {
                select: { name: true, username: true },
              },
              id: true,
              updatedAt: true,
              updatedBy: {
                select: { name: true, username: true },
              },
            },
            take: 3,
            where: { deletedAt: null },
          },
          packages: {
            include: {
              coach: {
                select: { firstName: true, lastName: true },
              },
              package: {
                select: {
                  allowedEndTime: true,
                  allowedStartTime: true,
                  assignedCoach: {
                    select: { firstName: true, lastName: true },
                  },
                  deletedAt: true,
                  hasTimeRestriction: true,
                  isActive: true,
                  name: true,
                  packageType: true,
                  timeRestrictionLabel: true,
                },
              },
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            where: { deletedAt: null },
          },
        },
        where: { deletedAt: null, id: customerId },
      }),
      db.coach.findMany({
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        select: {
          firstName: true,
          id: true,
          isActive: true,
          lastName: true,
        },
        where: { deletedAt: null },
      }),
      db.package.findMany({
        orderBy: { name: "asc" },
        select: {
          assignedCoachId: true,
          defaultGuestPasses: true,
          id: true,
          name: true,
          packageType: true,
          sessionCount: true,
        },
        where: { deletedAt: null, isActive: true },
      }),
      db.package.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          isActive: true,
          name: true,
          packageType: true,
        },
        where: { deletedAt: null },
      }),
    ]);

  if (!customer) {
    notFound();
  }

  const errorMessage = query.error ? errorMessages[query.error] : null;
  const statusMessage = query.status ? statusMessages[query.status] : null;
  const latestNotes = customer.notes.map((note) => ({
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    createdByName: staffName(note.createdBy),
    id: note.id,
    updatedAt: note.updatedAt.toISOString(),
    updatedByName: note.updatedBy ? staffName(note.updatedBy) : null,
  }));

  return (
    <>
      <Link
        className="inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:text-primary-hover"
        href="/admin/customers"
      >
        ← Back to customer directory
      </Link>

      {statusMessage ? (
        <p className="mt-4 rounded-xl border border-status-low bg-card px-4 py-3 text-sm font-semibold text-foreground">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p
          className="mt-4 rounded-xl border border-status-high bg-card px-4 py-3 text-sm font-semibold text-foreground"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <Card className="mt-4 overflow-hidden p-0">
        <div className="bg-soft-blue p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">
                Member ID: {customer.customerCode}
              </p>
              <h2 className="mt-2 break-words text-3xl font-bold tracking-tight text-foreground">
                {customer.fullName}
              </h2>
              <p className="mt-2 text-sm text-secondary">
                {customer.firstName || customer.lastName
                  ? `${customer.firstName ?? "First name missing"} · ${
                      customer.lastName ?? "Surname missing"
                    }`
                  : "First name and surname have not been entered separately."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                status={customer.status === "ACTIVE" ? "active" : "notInGym"}
              >
                {customer.status.toLowerCase()}
              </StatusBadge>
              <StatusBadge
                status={
                  customer.gymPresenceStatus === "IN_GYM"
                    ? "inGym"
                    : "notInGym"
                }
              >
                {customer.gymPresenceStatus
                  .toLowerCase()
                  .replaceAll("_", " ")}
              </StatusBadge>
              {!customer.birthDate ||
              !customer.phone ||
              !customer.emergencyPhone ? (
                <StatusBadge status="medium">profile data missing</StatusBadge>
              ) : null}
            </div>
          </div>

          <CustomerWorkspaceActions />

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl bg-card p-4">
              <dt className="font-semibold text-secondary">Birth date</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {displayDate(customer.birthDate)}
              </dd>
            </div>
            <div className="rounded-xl bg-card p-4">
              <dt className="font-semibold text-secondary">Phone</dt>
              <dd className="mt-1 break-words font-semibold text-foreground">
                {customer.phone ?? "Not provided"}
              </dd>
            </div>
            <div className="rounded-xl bg-card p-4">
              <dt className="font-semibold text-secondary">
                Emergency phone
              </dt>
              <dd className="mt-1 break-words font-semibold text-foreground">
                {customer.emergencyPhone ?? "Not provided"}
              </dd>
            </div>
            <div className="rounded-xl bg-card p-4">
              <dt className="font-semibold text-secondary">Assigned coach</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {customer.assignedCoach
                  ? `${customer.assignedCoach.firstName} ${customer.assignedCoach.lastName}`
                  : "Not assigned"}
              </dd>
            </div>
            <div className="rounded-xl bg-card p-4">
              <dt className="font-semibold text-secondary">Package history</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {customer.packages.length} record
                {customer.packages.length === 1 ? "" : "s"}
              </dd>
            </div>
          </dl>
        </div>

        <details
          className="scroll-mt-6"
          id="edit-customer-profile"
        >
          <summary className="cursor-pointer list-none border-t border-border px-5 py-4 font-bold text-foreground transition-colors hover:bg-page sm:px-7">
            <span className="inline-flex rounded-lg bg-brand px-4 py-2 text-white">
              Edit customer profile
            </span>
            <span className="ml-3 text-sm font-normal text-secondary">
              Expand to change identity, contact, status, or coach.
            </span>
          </summary>
          <div className="animate-panel-in border-t border-border bg-page p-5 sm:p-7">
            <CustomerForm
              coaches={coaches}
              customer={customer}
              returnToDetail
            />
          </div>
        </details>
      </Card>

      <div className="mt-6">
        <CustomerNotesPanel
          customerCode={customer.customerCode}
          customerId={customer.id}
          initialNotes={latestNotes}
          noteCount={customer._count.notes}
        />
      </div>

      <Card className="mt-6">
        <CustomerPackageOverview
          coaches={coaches}
          customerCode={customer.customerCode}
          customerId={customer.id}
          packageDefinitions={packageDefinitions}
          packages={customer.packages}
        />
      </Card>

      <section className="mt-6">
        <details
          className="smooth-panel scroll-mt-6 rounded-2xl border border-border bg-card shadow-sm open:border-brand"
          id="assign-customer-package"
        >
          <summary className="cursor-pointer list-none rounded-2xl px-5 py-4 font-bold text-foreground transition-colors hover:bg-soft-blue sm:px-6">
            <span className="inline-flex rounded-lg bg-button-success px-4 py-2 text-white">
              Assign / Renew package or service
            </span>
            <span className="mt-1 block text-sm font-normal text-secondary">
              Creates a new assignment while preserving the complete package
              history.
            </span>
          </summary>
          <div className="animate-panel-in border-t border-border p-5 sm:p-6">
            <CustomerPackageAssignmentForm
              coaches={coaches}
              customerId={customer.id}
              packages={activePackages}
              returnToDetail
            />
          </div>
        </details>
      </section>
    </>
  );
}
