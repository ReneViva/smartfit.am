import type { Prisma } from "@prisma/client";

import {
  CustomerSearchResults,
} from "../../components/registration/customer-search-results";
import { RegistrationCustomerCard } from "../../components/registration/customer-card";
import {
  CustomerLookupControls,
  CustomerLookupMotion,
  CustomerWorkspaceMotion,
} from "../../components/registration/customer-lookup-motion";
import { Card } from "../../components/ui/card";
import { db } from "../../lib/db";
import { noteWithStaffSelect, toCustomerNoteView } from "../../lib/notes";
import { getRegistrationCurrentMembershipVisitSummary } from "../../lib/registration/current-membership-visits";
import { getCustomerRecentActivity } from "../../lib/registration/recent-activity";

export const dynamic = "force-dynamic";

type RegistrationPageProps = {
  searchParams: Promise<{
    customer?: string;
    error?: string;
    freezeDaysLeft?: string;
    customerFilter?: string;
    q?: string;
    showAll?: string;
    sort?: string;
    status?: string;
    view?: string;
  }>;
};

const customerFilters = [
  "all",
  "in-gym",
  "not-in-gym",
  "active",
  "inactive",
  "needs-attention",
] as const;

type CustomerFilter = (typeof customerFilters)[number];

const customerSorts = [
  "name-asc",
  "name-desc",
  "newest",
  "oldest",
  "code-asc",
  "code-desc",
] as const;

type CustomerSort = (typeof customerSorts)[number];

function parseCustomerFilter(value: string | undefined): CustomerFilter {
  return customerFilters.includes(value as CustomerFilter)
    ? (value as CustomerFilter)
    : "all";
}

function parseCustomerSort(value: string | undefined): CustomerSort {
  return customerSorts.includes(value as CustomerSort)
    ? (value as CustomerSort)
    : "name-asc";
}

function customerOrderBy(
  sort: CustomerSort,
): Prisma.CustomerOrderByWithRelationInput[] {
  switch (sort) {
    case "name-desc":
      return [{ fullName: "desc" }, { customerCode: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }, { fullName: "asc" }];
    case "oldest":
      return [{ createdAt: "asc" }, { fullName: "asc" }];
    case "code-asc":
      return [{ customerCode: "asc" }];
    case "code-desc":
      return [{ customerCode: "desc" }];
    default:
      return [{ fullName: "asc" }, { customerCode: "asc" }];
  }
}

const errorMessages: Record<string, string> = {
  "already-in-gym": "This customer is already in the gym.",
  "check-out-stale":
    "The customer or occupancy changed before check-out. Review and try again.",
  "check-out-unavailable":
    "Check-out could not be completed. Please try again.",
  "check-in-unavailable": "Check-in could not be completed. Please try again.",
  "correction-unavailable":
    "The session correction could not be saved. Please try again.",
  "invalid-check-in": "The selected customer is unavailable.",
  "invalid-guest-source":
    "The guest-pass source must be the selected, usable membership.",
  "invalid-guest-count":
    "Guest count must be a non-negative whole number.",
  "invalid-correction":
    "Enter a valid non-negative whole number for remaining sessions.",
  "invalid-check-out": "The selected customer is unavailable for check-out.",
  "invalid-occupancy-correction":
    "Enter a valid non-negative whole number for occupancy.",
  "invalid-occupancy":
    "Live occupancy has an invalid count. Correct occupancy before checking in.",
  "invalid-package":
    "One or more selected memberships are not usable for check-in.",
  "invalid-service":
    "One or more selected service lines are unavailable for this membership.",
  "invalid-service-correction":
    "Choose an active service line and enter a valid remaining session count.",
  "invalid-service-deduction":
    "Service deductions must be non-negative whole numbers.",
  "guest-passes-insufficient":
    "The selected membership does not have enough remaining guest passes.",
  "guest-source-required":
    "Choose which selected membership provides the guest passes.",
  "frozen-package":
    "Frozen memberships cannot be selected or used for check-in.",
  "expired-membership":
    "Expired memberships can be checked in only without deductions.",
  "membership-conflict":
    "This customer has multiple active memberships from older data. Admin must resolve before fast check-in.",
  "daily-limit-reached":
    "This membership has reached its check-in limit for the current local day.",
  "interval-limit-reached":
    "This membership has reached its check-in limit for the membership interval.",
  "invalid-freeze-days":
    "Freeze duration must be a positive whole number of days.",
  "invalid-package-action":
    "The selected membership is unavailable for that action.",
  "open-visit": "This customer already has an open gym visit.",
  "no-open-visit":
    "This customer has no open gym visit and cannot be checked out.",
  "not-in-gym": "This customer is not currently in the gym.",
  "occupancy-correction-unavailable":
    "The occupancy correction could not be saved. Please try again.",
  "occupancy-zero":
    "Live occupancy is lower than this visit's recorded party size. Correct the live count before checking out.",
  "package-selection-required":
    "Select at least one usable membership before check-in.",
  "package-freeze-unavailable":
    "The membership could not be frozen. Please review it and try again.",
  "package-freeze-disabled":
    "Membership freeze access is disabled for Registration. Admin can enable it in Settings.",
  "package-freeze-admin-only":
    "Membership and service freezing is Admin-only. Registration cannot freeze or reactivate.",
  "package-active-freeze":
    "This membership already has an active freeze.",
  "package-no-freeze-chances":
    "This membership has no remaining freeze chances.",
  "package-freeze-counter-invalid":
    "Remaining freeze chances are invalid for this membership.",
  "package-freeze-counter-mismatch":
    "Remaining freeze chances do not match the freeze record limit. Ask Admin to review the assignment counter.",
  "package-freeze-days-limit":
    "This membership already used the maximum 30 freeze days.",
  "package-freeze-limit": "Maximum 3 freezes already used.",
  "package-not-freezable":
    "Only active, unexpired memberships with remaining sessions can be frozen.",
  "package-not-frozen":
    "Only frozen memberships can be reactivated.",
  "package-reactivation-unavailable":
    "The membership could not be reactivated. Please review it and try again.",
  "package-status-stale":
    "The membership status changed before the action completed. Review and try again.",
  "package-stale":
    "A selected membership changed before check-in. Review it and try again.",
  "service-sessions-insufficient":
    "A selected service line does not have enough remaining sessions.",
  "service-correction-balance-invalid":
    "Remaining service sessions cannot exceed initial service sessions.",
  "service-expired":
    "That service line is expired and cannot be deducted.",
  "service-frozen":
    "That service line is frozen and cannot be deducted.",
  "service-not-yet-active":
    "That service line is not active yet and cannot be deducted.",
  "service-stale":
    "A selected service line changed before check-in. Review it and try again.",
  "stale-correction":
    "Sessions changed after this card loaded. Review the updated value and try again.",
  "stale-occupancy":
    "Occupancy changed after this page loaded. Review the current count and try again.",
  "time-restriction-violation":
    "This membership is outside its allowed check-in time window.",
};

function freezeDaysExceededMessage(value: string | undefined) {
  const freezeDaysLeft = Number(value);

  if (Number.isInteger(freezeDaysLeft) && freezeDaysLeft >= 0) {
    return `Only ${freezeDaysLeft} freeze day${freezeDaysLeft === 1 ? "" : "s"} remain for this membership.`;
  }

  return "The requested freeze would exceed the maximum 30 freeze days.";
}

export default async function RegistrationPage({
  searchParams,
}: RegistrationPageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 200) ?? "";
  const customerFilter = parseCustomerFilter(params.customerFilter);
  const sort = parseCustomerSort(params.sort);
  const selectedCustomerCode = params.customer?.trim().slice(0, 100) ?? "";
  const compact = params.view === "compact";
  const showAllPackages = params.showAll === "1";
  const settings = await db.gymSettings.findFirst({
    select: {
      hideInactiveCustomersFromRegistration: true,
    },
  });
  const hideInactiveCustomers =
    settings?.hideInactiveCustomersFromRegistration ?? false;
  const customerVisibility = {
    deletedAt: null,
    ...(hideInactiveCustomers ? { status: "ACTIVE" as const } : {}),
  };
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const customerConditions: Prisma.CustomerWhereInput[] = [
    customerVisibility,
  ];

  if (query) {
    customerConditions.push({
      OR: [
        { customerCode: { contains: query, mode: "insensitive" } },
        { fullName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { emergencyPhone: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (customerFilter === "in-gym") {
    customerConditions.push({ gymPresenceStatus: "IN_GYM" });
  } else if (customerFilter === "not-in-gym") {
    customerConditions.push({ gymPresenceStatus: "NOT_IN_GYM" });
  } else if (customerFilter === "active") {
    customerConditions.push({ status: "ACTIVE" });
  } else if (customerFilter === "inactive") {
    customerConditions.push({ status: "INACTIVE" });
  } else if (customerFilter === "needs-attention") {
    customerConditions.push({
      OR: [
        { birthDate: null },
        { packages: { none: { deletedAt: null } } },
        {
          packages: {
            some: {
              deletedAt: null,
              OR: [
                { expirationDate: { lt: today } },
                { remainingSessions: { lte: 0 } },
                { status: { in: ["EXPIRED", "FROZEN"] } },
              ],
            },
          },
        },
      ],
    });
  }

  const [searchResults, selectedCustomer, occupancy] = await Promise.all([
    db.customer.findMany({
      orderBy: customerOrderBy(sort),
      select: {
        assignedCoach: {
          select: { firstName: true, lastName: true },
        },
        birthDate: true,
        customerCode: true,
        fullName: true,
        gymPresenceStatus: true,
        packages: {
          select: {
            expirationDate: true,
            remainingSessions: true,
            status: true,
          },
          where: { deletedAt: null },
        },
        phone: true,
        status: true,
      },
      where: {
        AND: customerConditions,
      },
    }),
    selectedCustomerCode
      ? db.customer.findFirst({
          include: {
            assignedCoach: {
              select: { firstName: true, lastName: true },
            },
            notes: {
              orderBy: [{ createdAt: "desc" }, { id: "desc" }],
              select: noteWithStaffSelect,
              where: { deletedAt: null },
            },
            packages: {
              include: {
                services: {
                  orderBy: [{ sortOrder: "asc" }, { serviceName: "asc" }],
                  select: {
                    category: {
                      select: { name: true },
                    },
                    coach: {
                      select: { firstName: true, lastName: true },
                    },
                    coachName: true,
                    deletedAt: true,
                    endDate: true,
                    freezes: {
                      select: {
                        plannedEndDate: true,
                        startDate: true,
                        status: true,
                      },
                      where: { status: "ACTIVE" },
                    },
                    id: true,
                    initialSessions: true,
                    isActive: true,
                    remainingSessions: true,
                    serviceName: true,
                    sortOrder: true,
                    startDate: true,
                  },
                  where: { deletedAt: null },
                },
                coach: {
                  select: { firstName: true, lastName: true },
                },
                freezes: {
                  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                  select: {
                    actualDays: true,
                    customerPackageServiceId: true,
                    plannedDays: true,
                    plannedEndDate: true,
                    startDate: true,
                    status: true,
                  },
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
              orderBy: { createdAt: "desc" },
              where: { deletedAt: null },
            },
          },
          where: {
            ...customerVisibility,
            customerCode: selectedCustomerCode,
          },
        })
      : Promise.resolve(null),
    db.occupancyState.findFirst({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        currentCount: true,
      },
    }),
  ]);
  const errorMessage =
    params.error === "package-freeze-days-exceeded"
      ? freezeDaysExceededMessage(params.freezeDaysLeft)
      : params.error
        ? errorMessages[params.error]
        : null;
  const statusMessage =
    params.status === "checked-in"
      ? "Customer checked in successfully."
      : params.status === "checked-out"
        ? "Customer checked out successfully."
        : params.status === "package-frozen"
          ? "Membership frozen. Its expiration date was extended by the selected duration."
          : params.status === "package-reactivated"
            ? "Membership reactivated. Expiration was recalculated from the actual frozen days."
            : params.status === "package-reactivated-expired"
              ? "Membership reactivated as expired. Expiration was recalculated from the actual frozen days."
        : params.status === "correction-saved"
        ? "Remaining sessions updated and logged."
        : params.status === "service-correction-saved"
          ? "Service sessions updated and logged."
        : params.status === "occupancy-corrected"
          ? "Live occupancy updated and logged."
          : params.status === "occupancy-no-change"
            ? "No occupancy change was needed."
        : params.status === "no-change"
          ? "No session change was needed."
          : null;
  const currentOccupancy = Math.max(0, occupancy?.currentCount ?? 0);
  const [recentActivity, currentMembershipVisitSummary] = selectedCustomer
    ? await Promise.all([
        getCustomerRecentActivity(selectedCustomer.id),
        getRegistrationCurrentMembershipVisitSummary(selectedCustomer.id),
      ])
    : [[], null];

  return (
    <>
      <header className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Registration
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Reception workspace
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-secondary">
            Find a customer, understand their current status, and complete
            daily reception actions from one workspace.
          </p>
        </div>
        <div className="min-w-44 rounded-xl border border-border bg-page px-4 py-3 lg:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
            Live occupancy
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {currentOccupancy}
          </p>
          <p className="text-sm text-secondary">people currently inside</p>
        </div>
      </header>

      {hideInactiveCustomers ? (
        <p className="mt-6 rounded-xl border border-status-medium bg-card px-4 py-3 text-sm font-semibold text-foreground">
          Inactive customers are hidden by the current admin setting.
        </p>
      ) : null}
      {statusMessage ? (
        <p className="mt-6 rounded-xl border border-status-low bg-card px-4 py-3 text-sm font-semibold text-foreground">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p
          className="mt-6 rounded-xl border border-status-high bg-card px-4 py-3 text-sm font-semibold text-foreground"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <CustomerLookupMotion selectedCustomerCode={selectedCustomerCode}>
        <Card className="mt-6 scroll-mt-6 p-5 sm:p-6" id="customer-search">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
              Customer lookup
            </p>
            <h3 className="mt-1 text-xl font-bold text-foreground">
              Search and select a customer
            </h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Browse all customers or narrow the visible list by name, member
              ID, phone, status, or membership attention.
            </p>
          </div>
          <CustomerLookupControls
            compact={compact}
            customerFilter={customerFilter}
            query={query}
            selectedCustomerCode={selectedCustomerCode}
            showAllPackages={showAllPackages}
            sort={sort}
          />
        </Card>

        <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(20rem,0.75fr)_minmax(0,1.25fr)]">
          <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
            <CustomerSearchResults
              compact={compact}
              customerFilter={customerFilter}
              key={`${query}-${customerFilter}-${sort}`}
              query={query}
              results={searchResults}
              selectedCustomerCode={selectedCustomerCode}
              showAllPackages={showAllPackages}
              sort={sort}
            />
          </div>

          <CustomerWorkspaceMotion
            key={selectedCustomer?.id ?? selectedCustomerCode ?? "empty"}
            selectedCustomerKey={selectedCustomer?.id ?? null}
          >
            {selectedCustomer ? (
              <RegistrationCustomerCard
                compact={compact}
                customer={{
                  ...selectedCustomer,
                  notes: selectedCustomer.notes.map(toCustomerNoteView),
                }}
                currentMembershipVisitSummary={currentMembershipVisitSummary}
                recentActivity={recentActivity}
                showAllPackages={showAllPackages}
              />
            ) : selectedCustomerCode ? (
              <section className="smooth-panel rounded-2xl border border-status-medium bg-card px-6 py-8 shadow-sm">
                <h3 className="text-xl font-bold text-foreground">
                  Customer workspace unavailable
                </h3>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  That customer is unavailable or hidden by registration
                  settings. Search again to open another customer workspace.
                </p>
              </section>
            ) : (
              <section className="smooth-panel overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border bg-soft-blue px-6 py-6 sm:px-8">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-active">
                    Customer workspace
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-foreground">
                    Select a customer to begin
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
                    Membership services, check-in or check-out, customer notes,
                    and recent activity will appear here.
                  </p>
                </div>
              </section>
            )}
          </CustomerWorkspaceMotion>
        </div>
      </CustomerLookupMotion>
    </>
  );
}
