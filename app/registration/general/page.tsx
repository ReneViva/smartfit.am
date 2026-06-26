import type {
  CustomerPackageStatus,
  CustomerStatus,
  GymPresenceStatus,
  Prisma,
} from "@prisma/client";
import Link from "next/link";

import { checkOutAction } from "../actions";
import { CheckInPanel } from "../../../components/registration/check-in-panel";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/ui/status-badge";
import { db } from "../../../lib/db";
import { packageTypeLabel } from "../../../lib/package-types";
import { packageTimeRestrictionReason } from "../../../lib/registration/package-usability";

export const dynamic = "force-dynamic";

type GeneralPageProps = {
  searchParams: Promise<{
    customer?: string;
    error?: string;
    q?: string;
    status?: string;
  }>;
};

type AvatarCustomer = {
  fullName: string;
  id: string;
  profileImageUrl: string | null;
  updatedAt: Date;
};

type SearchResultCustomer = AvatarCustomer & {
  customerCode: string;
  gymPresenceStatus: GymPresenceStatus;
  packages: Array<{
    expirationDate: Date;
    remainingSessions: number;
    services: Array<{
      deletedAt: Date | null;
      isActive: boolean;
      remainingSessions: number;
    }>;
    status: CustomerPackageStatus;
  }>;
  phone: string | null;
  status: CustomerStatus;
};

const GENERAL_PATH = "/registration/general";
const SEARCH_LIMIT = 30;
const SERVICE_DEDUCTION_REASON_PREFIX = "Service check-in deduction:";

const errorMessages: Record<string, string> = {
  "already-in-gym": "This customer is already in the gym.",
  "check-out-stale":
    "The customer or occupancy changed before check-out. Review and try again.",
  "check-out-unavailable":
    "Check-out could not be completed. Please try again.",
  "check-in-unavailable": "Check-in could not be completed. Please try again.",
  "daily-limit-reached":
    "This membership has reached its check-in limit for the current local day.",
  "expired-membership":
    "Expired memberships can be checked in only without deductions.",
  "frozen-package":
    "Frozen memberships cannot be selected or used for check-in.",
  "guest-passes-insufficient":
    "The selected membership does not have enough remaining guest passes.",
  "guest-source-required":
    "Choose which selected membership provides the guest passes.",
  "invalid-check-in": "The selected customer is unavailable.",
  "invalid-check-out": "The selected customer is unavailable for check-out.",
  "invalid-guest-count": "Guest count must be a non-negative whole number.",
  "invalid-guest-source":
    "The guest-pass source must be a selected, usable membership.",
  "invalid-occupancy":
    "Live occupancy has an invalid count. Correct occupancy before checking in.",
  "invalid-service":
    "One or more selected service lines are unavailable for this membership.",
  "invalid-service-deduction":
    "Service deductions must be non-negative whole numbers.",
  "interval-limit-reached":
    "This membership has reached its check-in limit for the membership interval.",
  "membership-conflict":
    "This customer has multiple active memberships from older data. Admin must resolve before fast check-in.",
  "no-open-visit":
    "This customer has no open gym visit and cannot be checked out.",
  "not-in-gym": "This customer is not currently in the gym.",
  "occupancy-zero":
    "Live occupancy is lower than this visit's recorded party size. Correct the live count before checking out.",
  "open-visit": "This customer already has an open gym visit.",
  "package-stale":
    "A selected membership changed before check-in. Review it and try again.",
  "service-sessions-insufficient":
    "A selected service line does not have enough remaining sessions.",
  "service-stale":
    "A selected service line changed before check-in. Review it and try again.",
  "time-restriction-violation":
    "This membership is outside its allowed check-in time window.",
};

const statusMessages: Record<string, string> = {
  "checked-in": "Customer checked in successfully.",
  "checked-out": "Customer checked out successfully.",
};

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value);
}

function displayDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function timeInside(checkedInAt: Date) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - checkedInAt.getTime()) / 60_000),
  );
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

function initials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SF"
  );
}

function profileImageSrc(customerId: string, version: Date) {
  const params = new URLSearchParams({ v: version.toISOString() });

  return `/api/internal/customer-profile-image/${encodeURIComponent(customerId)}?${params.toString()}`;
}

function CustomerAvatar({
  customer,
  size = "small",
}: {
  customer: AvatarCustomer;
  size?: "small" | "large";
}) {
  const sizeClass = size === "large" ? "h-20 w-20" : "h-14 w-14";
  const textClass = size === "large" ? "text-2xl" : "text-lg";

  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden rounded-full border border-border bg-card shadow-sm`}
    >
      {customer.profileImageUrl ? (
        <img
          alt={`${customer.fullName} profile photo`}
          className="h-full w-full object-cover"
          src={profileImageSrc(customer.id, customer.updatedAt)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-brand font-bold text-white ${textClass}`}
        >
          {initials(customer.fullName)}
        </div>
      )}
    </div>
  );
}

function generalCustomerHref(customerCode: string, query: string) {
  const params = new URLSearchParams({ customer: customerCode });

  if (query) {
    params.set("q", query);
  }

  return `${GENERAL_PATH}?${params.toString()}#general-check-in`;
}

function fullCustomerHref(customerCode: string) {
  const params = new URLSearchParams({
    customer: customerCode,
    view: "compact",
  });

  return `/registration?${params.toString()}#customer-workspace`;
}

function packageTimeRule(customerPackage: {
  package: {
    allowedEndTime: string | null;
    allowedStartTime: string | null;
    timeRestrictionLabel: string | null;
  };
}) {
  if (customerPackage.package.timeRestrictionLabel) {
    return customerPackage.package.timeRestrictionLabel;
  }

  if (
    customerPackage.package.allowedStartTime &&
    customerPackage.package.allowedEndTime
  ) {
    return `${customerPackage.package.allowedStartTime} - ${customerPackage.package.allowedEndTime}`;
  }

  if (customerPackage.package.allowedEndTime) {
    return `Before ${customerPackage.package.allowedEndTime}`;
  }

  return "No time restriction";
}

function serviceNameFromReason(reason: string | null) {
  if (!reason?.startsWith(SERVICE_DEDUCTION_REASON_PREFIX)) {
    return null;
  }

  return reason
    .slice(SERVICE_DEDUCTION_REASON_PREFIX.length)
    .replace(/\s+\[service:[^\]]+\]$/, "")
    .trim();
}

function warningBadges(customer: SearchResultCustomer, today: Date) {
  const activePackages = customer.packages.filter(
    (membership) => membership.status === "ACTIVE",
  ).length;
  const hasFrozen = customer.packages.some(
    (membership) => membership.status === "FROZEN",
  );
  const hasExpired = customer.packages.some(
    (membership) =>
      membership.status === "EXPIRED" || membership.expirationDate < today,
  );
  const hasZeroSessions = customer.packages.some(
    (membership) =>
      membership.remainingSessions <= 0 ||
      membership.services.some(
        (service) =>
          service.isActive && !service.deletedAt && service.remainingSessions <= 0,
      ),
  );

  return (
    <>
      <StatusBadge status={customer.status === "ACTIVE" ? "active" : "notInGym"}>
        {customer.status.toLowerCase()} customer
      </StatusBadge>
      <StatusBadge status="notInGym">not in gym</StatusBadge>
      <StatusBadge status={activePackages ? "active" : "high"}>
        {activePackages} active membership{activePackages === 1 ? "" : "s"}
      </StatusBadge>
      {hasFrozen ? <StatusBadge status="medium">frozen</StatusBadge> : null}
      {hasExpired ? <StatusBadge status="expired">expired</StatusBadge> : null}
      {hasZeroSessions ? (
        <StatusBadge status="high">zero sessions</StatusBadge>
      ) : null}
    </>
  );
}

function SearchResultCard({
  customer,
  query,
  selectedCustomerCode,
  today,
}: {
  customer: SearchResultCustomer;
  query: string;
  selectedCustomerCode: string;
  today: Date;
}) {
  const selected = customer.customerCode === selectedCustomerCode;

  return (
    <div
      className={`rounded-xl border p-4 ${
        selected
          ? "border-brand bg-soft-blue"
          : "border-border bg-page hover:border-brand"
      }`}
    >
      <div className="flex gap-3">
        <CustomerAvatar customer={customer} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-brand">
            Member ID: {customer.customerCode}
          </p>
          <h4 className="mt-1 break-words text-lg font-bold text-foreground">
            {customer.fullName}
          </h4>
          {customer.phone ? (
            <p className="mt-1 break-words text-sm text-secondary">
              Phone: {customer.phone}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {warningBadges(customer, today)}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          href={generalCustomerHref(customer.customerCode, query)}
        >
          {selected ? "Selected" : "Select for check-in"}
        </Link>
        <Link
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-neutral px-4 py-2 text-sm font-semibold text-foreground hover:bg-neutral-hover"
          href={fullCustomerHref(customer.customerCode)}
        >
          Open customer
        </Link>
      </div>
    </div>
  );
}

export default async function RegistrationGeneralPage({
  searchParams,
}: GeneralPageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 200) ?? "";
  const selectedCustomerCode = params.customer?.trim().slice(0, 100) ?? "";
  const settings = await db.gymSettings.findFirst({
    select: { hideInactiveCustomersFromRegistration: true },
  });
  const hideInactiveCustomers =
    settings?.hideInactiveCustomersFromRegistration ?? false;
  const customerVisibility: Prisma.CustomerWhereInput = {
    deletedAt: null,
    ...(hideInactiveCustomers ? { status: "ACTIVE" as const } : {}),
  };
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const searchConditions: Prisma.CustomerWhereInput[] = [
    customerVisibility,
    { gymPresenceStatus: "NOT_IN_GYM" },
  ];

  if (query) {
    searchConditions.push({
      OR: [
        { customerCode: { contains: query, mode: "insensitive" } },
        { fullName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  const [searchResults, selectedCustomer, currentVisits, occupancy] =
    await Promise.all([
      db.customer.findMany({
        orderBy: [{ fullName: "asc" }, { customerCode: "asc" }],
        select: {
          customerCode: true,
          fullName: true,
          gymPresenceStatus: true,
          id: true,
          packages: {
            select: {
              expirationDate: true,
              remainingSessions: true,
              services: {
                select: {
                  deletedAt: true,
                  isActive: true,
                  remainingSessions: true,
                },
                where: { deletedAt: null },
              },
              status: true,
            },
            where: { deletedAt: null },
          },
          phone: true,
          profileImageUrl: true,
          status: true,
          updatedAt: true,
        },
        take: SEARCH_LIMIT,
        where: { AND: searchConditions },
      }),
      selectedCustomerCode
        ? db.customer.findFirst({
            include: {
              assignedCoach: {
                select: { firstName: true, lastName: true },
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
                  services: {
                    orderBy: [{ sortOrder: "asc" }, { serviceName: "asc" }],
                    select: {
                      category: {
                        select: { name: true },
                      },
                      coach: {
                        select: { firstName: true, lastName: true },
                      },
                      deletedAt: true,
                      id: true,
                      initialSessions: true,
                      isActive: true,
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
            where: {
              ...customerVisibility,
              customerCode: selectedCustomerCode,
            },
          })
        : Promise.resolve(null),
      db.gymVisit.findMany({
        orderBy: { checkedInAt: "asc" },
        select: {
          checkedInAt: true,
          guestCountUsed: true,
          id: true,
          occupancyDelta: true,
          packageUsages: {
            select: {
              guestPassesDeducted: true,
              sessionChange: {
                select: { delta: true, reason: true },
              },
              sessionsDeducted: true,
              customerPackage: {
                select: {
                  package: { select: { name: true } },
                },
              },
            },
          },
          customer: {
            select: {
              customerCode: true,
              fullName: true,
              id: true,
            },
          },
        },
        take: 100,
        where: {
          checkedOutAt: null,
          customer: {
            is: {
              deletedAt: null,
              gymPresenceStatus: "IN_GYM",
            },
          },
        },
      }),
      db.occupancyState.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { currentCount: true },
      }),
    ]);

  const currentOccupancy = Math.max(0, occupancy?.currentCount ?? 0);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;
  const activeMemberships =
    selectedCustomer?.packages.filter(
      (membership) => membership.status === "ACTIVE",
    ) ?? [];
  const frozenMembershipCount =
    selectedCustomer?.packages.filter(
      (membership) => membership.status === "FROZEN",
    ).length ?? 0;
  const activeMembership =
    activeMemberships.length === 1 ? activeMemberships[0] : null;
  const checkInMembership = activeMembership
    ? (() => {
        const packageCoach =
          activeMembership.coach ?? activeMembership.package.assignedCoach;
        const isExpired = activeMembership.expirationDate < today;

        return {
          coachName: packageCoach
            ? `${packageCoach.firstName} ${packageCoach.lastName}`
            : null,
          expirationLabel: displayDate(activeMembership.expirationDate),
          id: activeMembership.id,
          isExpired,
          name: activeMembership.package.name,
          packageType: packageTypeLabel(activeMembership.package.packageType),
          remainingGuestPasses: activeMembership.remainingGuestPasses,
          services: activeMembership.services
            .filter((service) => service.isActive && !service.deletedAt)
            .map((service) => ({
              categoryName: service.category?.name ?? null,
              coachName: service.coach
                ? `${service.coach.firstName} ${service.coach.lastName}`
                : null,
              id: service.id,
              initialSessions: service.initialSessions,
              remainingSessions: service.remainingSessions,
              serviceName: service.serviceName,
            })),
          timeRestrictionReason: isExpired
            ? null
            : packageTimeRestrictionReason(activeMembership, new Date()),
          timeRule: packageTimeRule(activeMembership),
        };
      })()
    : null;

  return (
    <>
      <header className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Registration
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            General
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-page px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
              Live occupancy
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {currentOccupancy}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-page px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
              Open visits
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {currentVisits.length}
            </p>
          </div>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div className="min-w-0 space-y-6">
          <Card className="p-5 sm:p-6">
            <form className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <label className="block min-w-0 flex-1 text-sm font-semibold text-foreground">
                Search customers
                <input
                  className="mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
                  defaultValue={query}
                  name="q"
                  placeholder="Name, phone, or member code"
                />
              </label>
              <Button type="submit">Search</Button>
              {query || selectedCustomerCode ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-brand hover:text-primary-hover"
                  href={GENERAL_PATH}
                >
                  Clear
                </Link>
              ) : null}
            </form>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                  Check-in candidates
                </p>
                <h3 className="mt-1 text-xl font-bold text-foreground">
                  Search results
                </h3>
              </div>
              <p className="text-sm font-semibold text-secondary">
                {searchResults.length} shown
              </p>
            </div>

            {searchResults.length ? (
              <div className="mt-5 max-h-[30rem] space-y-3 overflow-y-auto overscroll-contain pr-1">
                {searchResults.map((customer) => (
                  <SearchResultCard
                    customer={customer}
                    key={customer.id}
                    query={query}
                    selectedCustomerCode={selectedCustomerCode}
                    today={today}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center text-secondary">
                No check-in candidates found.
              </p>
            )}
          </Card>

          <div className="scroll-mt-6" id="general-check-in">
            {selectedCustomer ? (
              <Card className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <CustomerAvatar customer={selectedCustomer} size="large" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand">
                      Member ID: {selectedCustomer.customerCode}
                    </p>
                    <h3 className="mt-1 break-words text-2xl font-bold text-foreground">
                      {selectedCustomer.fullName}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge
                        status={
                          selectedCustomer.gymPresenceStatus === "IN_GYM"
                            ? "inGym"
                            : "notInGym"
                        }
                      >
                        {selectedCustomer.gymPresenceStatus
                          .toLowerCase()
                          .replaceAll("_", " ")}
                      </StatusBadge>
                      <StatusBadge
                        status={
                          selectedCustomer.status === "ACTIVE"
                            ? "active"
                            : "notInGym"
                        }
                      >
                        {selectedCustomer.status.toLowerCase()} customer
                      </StatusBadge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral px-4 py-2 text-sm font-semibold text-foreground hover:bg-neutral-hover"
                        href={fullCustomerHref(selectedCustomer.customerCode)}
                      >
                        Open customer
                      </Link>
                    </div>
                  </div>
                </div>

                {selectedCustomer.gymPresenceStatus === "NOT_IN_GYM" ? (
                  <CheckInPanel
                    activeMembershipCount={activeMemberships.length}
                    compact
                    customerCode={selectedCustomer.customerCode}
                    customerId={selectedCustomer.id}
                    frozenMembershipCount={frozenMembershipCount}
                    membership={checkInMembership}
                    returnPath={GENERAL_PATH}
                    showAllPackages={false}
                  />
                ) : (
                  <p className="mt-5 rounded-xl border border-status-medium bg-page px-4 py-3 text-sm font-semibold leading-6 text-foreground">
                    This customer is currently in the gym and appears in the
                    checkout list.
                  </p>
                )}
              </Card>
            ) : selectedCustomerCode ? (
              <Card className="p-5 sm:p-6">
                <h3 className="text-xl font-bold text-foreground">
                  Customer unavailable
                </h3>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  This customer is archived, hidden by settings, or no longer
                  available to Registration.
                </p>
              </Card>
            ) : null}
          </div>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                  Currently in gym
                </p>
                <h3 className="mt-1 text-xl font-bold text-foreground">
                  Checkout
                </h3>
              </div>
              <StatusBadge status={currentVisits.length ? "inGym" : "notInGym"}>
                {currentVisits.length} inside
              </StatusBadge>
            </div>

            {currentVisits.length ? (
              <div className="mt-5 max-h-[calc(100vh-16rem)] space-y-3 overflow-y-auto overscroll-contain pr-1">
                {currentVisits.map((visit) => {
                  const usageSummaries = visit.packageUsages.map((usage) => {
                    const serviceName = serviceNameFromReason(
                      usage.sessionChange?.reason ?? null,
                    );
                    const label =
                      serviceName ?? usage.customerPackage.package.name;
                    const parts = [];

                    if (usage.sessionsDeducted > 0) {
                      parts.push(
                        `${usage.sessionsDeducted} session${
                          usage.sessionsDeducted === 1 ? "" : "s"
                        }`,
                      );
                    }

                    if (usage.guestPassesDeducted > 0) {
                      parts.push(
                        `${usage.guestPassesDeducted} guest pass${
                          usage.guestPassesDeducted === 1 ? "" : "es"
                        }`,
                      );
                    }

                    return `${label} (${parts.length ? parts.join(", ") : "no deduction"})`;
                  });

                  return (
                    <div
                      className="rounded-xl border border-border bg-page p-4"
                      key={visit.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status="inGym">in gym</StatusBadge>
                        {visit.guestCountUsed > 0 ? (
                          <StatusBadge status="active">
                            +{visit.guestCountUsed} guest
                            {visit.guestCountUsed === 1 ? "" : "s"} / party{" "}
                            {visit.occupancyDelta}
                          </StatusBadge>
                        ) : null}
                      </div>
                      <h4 className="mt-3 break-words text-lg font-bold text-foreground">
                        {visit.customer.fullName}
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-secondary">
                        Member ID: {visit.customer.customerCode}
                      </p>
                      <p className="mt-2 text-sm text-secondary">
                        Checked in {displayDateTime(visit.checkedInAt)} / inside{" "}
                        {timeInside(visit.checkedInAt)}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-secondary">
                        Used:{" "}
                        {usageSummaries.length
                          ? usageSummaries.join(", ")
                          : "No service deduction"}
                      </p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        <Link
                          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral px-4 py-2 text-sm font-semibold text-foreground hover:bg-neutral-hover"
                          href={fullCustomerHref(visit.customer.customerCode)}
                        >
                          Open customer
                        </Link>
                        <form action={checkOutAction}>
                          <input
                            name="customerCode"
                            type="hidden"
                            value={visit.customer.customerCode}
                          />
                          <input
                            name="customerId"
                            type="hidden"
                            value={visit.customer.id}
                          />
                          <input
                            name="showAllPackages"
                            type="hidden"
                            value="0"
                          />
                          <input
                            name="returnPath"
                            type="hidden"
                            value={GENERAL_PATH}
                          />
                          <Button
                            className="w-full"
                            type="submit"
                            variant="warning"
                          >
                            Check out
                          </Button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center text-secondary">
                No customers are currently inside.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
