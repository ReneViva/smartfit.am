import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerArchiveAction } from "../../../../components/admin/customer-archive-action";
import { CustomerProfileImagePanel } from "../../../../components/customer-profile-image-panel";
import { CustomerDocumentsPanel } from "../../../../components/admin/customer-documents-panel";
import { CustomerForm } from "../../../../components/admin/customer-form";
import { CustomerMembershipEditor } from "../../../../components/admin/customer-membership-editor";
import { CustomerNotesPanel } from "../../../../components/admin/customer-notes-panel";
import { CustomerPackageOverview } from "../../../../components/admin/customer-package-overview";
import { CustomerVisitHistory } from "../../../../components/admin/customer-visit-history";
import { CustomerWorkspaceActions } from "../../../../components/admin/customer-workspace-actions";
import { Card } from "../../../../components/ui/card";
import { StatusBadge } from "../../../../components/ui/status-badge";
import { getCustomerVisitHistoryForAdmin } from "../../../../lib/admin/customer-visit-history";
import { listCustomerDocumentsForAdmin } from "../../../../lib/customer-documents/actions";
import { db } from "../../../../lib/db";

type CustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{
    error?: string;
    freezeDaysLeft?: string;
    status?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "assignment-unavailable":
    "The package assignment could not be saved. Please try again.",
  "customer-unavailable": "The customer could not be saved. Please try again.",
  "customer-archive-in-gym":
    "Check out this customer before archiving their profile.",
  "customer-archive-open-visit":
    "Close the open visit before archiving this customer profile.",
  "customer-archive-stale":
    "This customer changed before archive completed. Review and try again.",
  "customer-archive-unavailable":
    "The customer profile could not be archived. Please try again.",
  "duplicate-code": "That member code is already assigned to another customer.",
  "invalid-assignment":
    "Choose a package and enter valid dates, sessions, guest passes, and status.",
  "invalid-access-limit":
    "Limited access rules require a positive whole-number check-in limit.",
  "invalid-birth-date": "Birth date cannot be in the future.",
  "invalid-coach": "The selected coach is not available.",
  "invalid-customer":
    "Member code, full name, birth date, and a valid status are required.",
  "invalid-date-order": "Expiration date cannot be before activation date.",
  "invalid-email": "Enter a valid email address or leave it empty.",
  "invalid-freeze-days":
    "Freeze duration must be a positive whole number of days.",
  "invalid-retroactive-freeze":
    "Retroactive freeze days could not be calculated from the latest checkout.",
  "invalid-package": "Choose an available package definition.",
  "invalid-membership":
    "Choose a package template and enter valid membership dates, guest passes, freeze chances, access limits, and status.",
  "invalid-membership-balance":
    "Remaining guest passes and freeze chances cannot exceed their allowed values.",
  "invalid-package-action": "The package status action is not available.",
  "invalid-package-balance":
    "Remaining sessions and guest passes cannot exceed their initial values.",
  "invalid-package-edit":
    "Enter valid assigned package dates, sessions, guest passes, freeze chances, coach, and status.",
  "document-download-unavailable":
    "The private document download could not be prepared. Please try again.",
  "package-edit-frozen-status":
    "Use the dedicated freeze/reactivate control to change frozen status.",
  "package-edit-open-visit":
    "This package is being used by an open visit and cannot be edited yet.",
  "package-edit-freeze-counter":
    "Remaining freeze chances cannot exceed the package's remaining slots out of 3.",
  "package-edit-stale":
    "This package changed before Save. Review the latest values and try again.",
  "package-edit-unavailable":
    "The assigned package could not be updated. Please review it and try again.",
  "package-freeze-unavailable":
    "The package could not be frozen. Please try again.",
  "package-active-freeze":
    "This package already has an active freeze record.",
  "package-no-checkout":
    "No completed checkout was found for a retroactive freeze.",
  "package-no-freeze-chances":
    "This assignment has no remaining freeze chances. Edit the counter before freezing.",
  "package-freeze-counter-invalid":
    "Remaining freeze chances are invalid for this package.",
  "package-freeze-counter-mismatch":
    "Remaining freeze chances do not match the freeze record limit. Review the assignment counter.",
  "package-freeze-days-limit":
    "This package already used the maximum 30 freeze days.",
  "package-freeze-limit": "Maximum 3 freezes already used.",
  "package-not-freezable":
    "Only an active, unexpired package with remaining sessions can be frozen.",
  "package-not-frozen": "This package is no longer frozen.",
  "package-reactivation-unavailable":
    "The package could not be reactivated. Please try again.",
  "retroactive-freeze-unavailable":
    "The retroactive freeze could not be saved. Please try again.",
  "package-status-stale":
    "The package status changed before the action completed. Review it and try again.",
  "membership-conflict":
    "This customer has multiple active membership containers from older data. Resolve manually before using the new membership editor.",
  "membership-exists":
    "This customer already has an active or frozen membership container.",
  "membership-unavailable":
    "The membership could not be saved. Please review it and try again.",
  "invalid-service":
    "Enter a service name and valid whole-number service sessions.",
  "invalid-service-reference":
    "Selected service package, category, or coach is not available.",
  "service-balance-invalid":
    "Remaining service sessions cannot exceed initial service sessions.",
  "service-unavailable":
    "The service line could not be saved. Please review it and try again.",
};

const statusMessages: Record<string, string> = {
  "customer-saved": "Customer profile updated.",
  "package-assigned":
    "Package assigned. A new package history record was created.",
  "package-frozen":
    "Package frozen. A freeze record was created and the chance counter was updated.",
  "package-reactivated":
    "Package reactivated. Expiration was recalculated from actual frozen days.",
  "package-reactivated-expired":
    "Package reactivated as expired because its expiration date has passed.",
  "package-retroactive-frozen":
    "Retroactive freeze saved. The package was not left frozen.",
  "package-updated":
    "Assigned package updated. Previous and new values were logged.",
  "membership-saved": "Membership saved.",
  "service-saved": "Service line saved.",
  "service-deactivated": "Service line deactivated.",
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

function freezeDaysExceededMessage(value: string | undefined) {
  const freezeDaysLeft = Number(value);

  if (Number.isInteger(freezeDaysLeft) && freezeDaysLeft >= 0) {
    return `Only ${freezeDaysLeft} freeze day${freezeDaysLeft === 1 ? "" : "s"} remain for this package.`;
  }

  return "The requested freeze would exceed the maximum 30 freeze days.";
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const [{ customerId }, query] = await Promise.all([params, searchParams]);
  const [
    customer,
    coaches,
    packageOptions,
    categories,
    customerDocuments,
    recentVisits,
    latestCompletedVisit,
    openVisit,
  ] =
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
              freezes: {
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                select: {
                  actualDays: true,
                  actualEndDate: true,
                  createdAt: true,
                  id: true,
                  mode: true,
                  notes: true,
                  originalExpirationDate: true,
                  plannedDays: true,
                  plannedEndDate: true,
                  resultingExpirationDate: true,
                  startDate: true,
                  status: true,
                },
              },
              services: {
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
                select: {
                  category: {
                    select: { name: true },
                  },
                  categoryId: true,
                  coach: {
                    select: { firstName: true, lastName: true },
                  },
                  coachId: true,
                  id: true,
                  initialSessions: true,
                  isActive: true,
                  notes: true,
                  package: {
                    select: { name: true },
                  },
                  packageId: true,
                  remainingSessions: true,
                  serviceName: true,
                  sortOrder: true,
                },
                where: { deletedAt: null },
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
          dailyCheckInLimit: true,
          defaultFreezeChances: true,
          defaultGuestPasses: true,
          hasUnlimitedDailyCheckIns: true,
          hasUnlimitedIntervalCheckIns: true,
          id: true,
          intervalCheckInLimit: true,
          isActive: true,
          name: true,
          packageType: true,
          sessionCount: true,
        },
        where: { deletedAt: null },
      }),
      db.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true },
        where: { isArchived: false },
      }),
      listCustomerDocumentsForAdmin(customerId),
      getCustomerVisitHistoryForAdmin(customerId, { take: 3 }),
      db.gymVisit.findFirst({
        orderBy: [{ checkedOutAt: "desc" }, { id: "desc" }],
        select: { checkedOutAt: true },
        where: {
          checkedOutAt: { not: null },
          customerId,
        },
      }),
      db.gymVisit.findFirst({
        select: { id: true },
        where: {
          checkedOutAt: null,
          customerId,
        },
      }),
    ]);

  if (!customer) {
    notFound();
  }

  const errorMessage =
    query.error === "package-freeze-days-exceeded"
      ? freezeDaysExceededMessage(query.freezeDaysLeft)
      : query.error
        ? errorMessages[query.error]
        : null;
  const statusMessage = query.status ? statusMessages[query.status] : null;
  const latestNotes = customer.notes.map((note) => ({
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    createdByName: staffName(note.createdBy),
    id: note.id,
    updatedAt: note.updatedAt.toISOString(),
    updatedByName: note.updatedBy ? staffName(note.updatedBy) : null,
  }));
  const documents = customerDocuments.map((document) => ({
    ...document,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  }));
  const activeMemberships = customer.packages.filter(
    (membership) => membership.status === "ACTIVE",
  );
  const activeMembershipConflict = activeMemberships.length > 1;
  const editableMembership = activeMembershipConflict
    ? null
    : (activeMemberships[0] ??
      customer.packages.find((membership) => membership.status === "FROZEN") ??
      null);

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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
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
              {customer.email || customer.phone ? (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-foreground">
                  {customer.email ? (
                    <p className="break-all">Email: {customer.email}</p>
                  ) : null}
                  {customer.phone ? (
                    <p className="break-words">Phone: {customer.phone}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <StatusBadge
                  status={
                    customer.status === "ACTIVE" ? "active" : "notInGym"
                  }
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
                  <StatusBadge status="medium">
                    profile data missing
                  </StatusBadge>
                ) : null}
              </div>
              <CustomerProfileImagePanel
                customerId={customer.id}
                customerName={customer.fullName}
                hasProfileImage={Boolean(customer.profileImageUrl)}
                version={customer.updatedAt.toISOString()}
              />
            </div>
          </div>

          <CustomerWorkspaceActions />
          <CustomerArchiveAction
            customerCode={customer.customerCode}
            customerId={customer.id}
            customerName={customer.fullName}
            hasOpenVisit={Boolean(openVisit)}
            isInGym={customer.gymPresenceStatus === "IN_GYM"}
          />

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-6">
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
            <div className="rounded-xl bg-card p-4 xl:col-span-2">
              <dt className="font-semibold text-secondary">Address</dt>
              <dd className="mt-1 break-words font-semibold text-foreground">
                {customer.address ?? "Not provided"}
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

      <Card className="mt-6 scroll-mt-6" id="customer-packages">
        <CustomerMembershipEditor
          activeMembershipConflict={activeMembershipConflict}
          categories={categories}
          coaches={coaches}
          customerId={customer.id}
          legacyActiveMemberships={activeMemberships}
          membership={editableMembership}
          packages={packageOptions}
        />
      </Card>

      <div className="mt-6">
        <CustomerDocumentsPanel
          customerId={customer.id}
          documents={documents}
        />
      </div>

      <Card className="mt-6 scroll-mt-6" id="customer-package-history">
        <CustomerPackageOverview
          coaches={coaches}
          customerCode={customer.customerCode}
          customerId={customer.id}
          latestCompletedCheckoutAt={
            latestCompletedVisit?.checkedOutAt ?? null
          }
          mode="history"
          packageDefinitions={packageOptions}
          packages={customer.packages}
          readOnly
        />
      </Card>

      <div className="mt-6">
        <CustomerVisitHistory
          description="Latest three check-in and check-out records. Open visits stay clearly marked."
          viewAllHref={`/admin/customers/${encodeURIComponent(customer.id)}/visits`}
          visits={recentVisits}
        />
      </div>
    </>
  );
}
