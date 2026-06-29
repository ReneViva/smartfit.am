import type {
  CustomerPackageStatus,
  CustomerStatus,
  GymPresenceStatus,
} from "@prisma/client";
import Link from "next/link";

import {
  calculateFreezeUsage,
  hasBlockingFreeze,
  MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE,
  MAX_TOTAL_FREEZE_DAYS_PER_CUSTOMER_PACKAGE,
} from "../../lib/package-freezes";
import {
  packageTimeRestrictionReason,
  packageUsability,
} from "../../lib/registration/package-usability";
import {
  membershipCoachDisplayName,
  membershipDisplayName,
  membershipTimeRuleDisplay,
  membershipTypeDisplayName,
  serviceLineCoachDisplayName,
  serviceLineDisplayName,
  serviceValidityStatus,
} from "../../lib/customer-memberships";
import type { CustomerNoteView } from "../../lib/notes";
import type { RegistrationCurrentMembershipVisitSummary } from "../../lib/registration/current-membership-visits";
import type { CustomerRecentActivityItem } from "../../lib/registration/recent-activity";
import { CustomerProfileImagePanel } from "../customer-profile-image-panel";
import { Card } from "../ui/card";
import { StatusBadge } from "../ui/status-badge";
import { CheckInPanel } from "./check-in-panel";
import { CheckOutPanel } from "./check-out-panel";
import { NotesSection } from "./notes-section";
import { RecentActivity } from "./recent-activity";
import { ServiceSessionStepper, SessionStepper } from "./session-stepper";

type PackageCardValue = {
  allowedEndTime: string | null;
  allowedStartTime: string | null;
  coach: {
    firstName: string;
    lastName: string;
  } | null;
  expirationDate: Date;
  freezes: {
    actualDays: number | null;
    customerPackageServiceId: string | null;
    plannedDays: number;
    plannedEndDate: Date | null;
    startDate: Date;
    status: string;
  }[];
  frozenAt: Date | null;
  hasTimeRestriction: boolean;
  id: string;
  membershipName: string | null;
  package: {
    allowedEndTime: string | null;
    allowedStartTime: string | null;
    assignedCoach: {
      firstName: string;
      lastName: string;
    } | null;
    deletedAt: Date | null;
    hasTimeRestriction: boolean;
    isActive: boolean;
    name: string;
    packageType: string;
    timeRestrictionLabel: string | null;
  } | null;
  remainingGuestPasses: number;
  remainingFreezeChances: number;
  remainingSessions: number;
  reactivatedAt: Date | null;
  services: {
    category: {
      name: string;
    } | null;
    coach: {
      firstName: string;
      lastName: string;
    } | null;
    coachName: string | null;
    deletedAt: Date | null;
    freezes: {
      plannedEndDate: Date | null;
      startDate: Date;
      status: string;
    }[];
    id: string;
    initialSessions: number;
    isActive: boolean;
    remainingSessions: number;
    serviceName: string;
    sortOrder: number;
    startDate: Date | null;
    endDate: Date | null;
  }[];
  status: CustomerPackageStatus;
  timeRestrictionLabel: string | null;
};

type CustomerCardValue = {
  assignedCoach: {
    firstName: string;
    lastName: string;
  } | null;
  birthDate: Date | null;
  customerCode: string;
  email: string | null;
  emergencyPhone: string | null;
  fullName: string;
  gymPresenceStatus: GymPresenceStatus;
  id: string;
  lastCheckInAt: Date | null;
  lastCheckOutAt: Date | null;
  notes: CustomerNoteView[];
  packages: PackageCardValue[];
  phone: string | null;
  profileImageUrl: string | null;
  status: CustomerStatus;
  updatedAt: Date;
};

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value);
}

function displayOptionalDate(value: Date | null) {
  return value ? displayDate(value) : "Missing date";
}

function displayDateTime(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value)
    : "No activity recorded";
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

function packageTimeRule(customerPackage: PackageCardValue) {
  return membershipTimeRuleDisplay(customerPackage);
}

function packageStatus(
  customerPackage: PackageCardValue,
  today: Date,
): {
  label: string;
  status: "active" | "expired" | "medium" | "notInGym";
} {
  if (
    customerPackage.status === "EXPIRED" ||
    customerPackage.expirationDate < today
  ) {
    return { label: "expired", status: "expired" };
  }

  if (customerPackage.status === "FROZEN") {
    return { label: "frozen / not usable", status: "medium" };
  }

  if (customerPackage.status === "INACTIVE") {
    return { label: "inactive", status: "notInGym" };
  }

  return { label: "active", status: "active" };
}

function CurrentMembershipVisitSummary({
  summary,
}: {
  summary: RegistrationCurrentMembershipVisitSummary | null;
}) {
  if (!summary) {
    return null;
  }

  return (
    <section
      className="smooth-panel rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Current membership visits
          </p>
          <h3 className="mt-1 text-2xl font-bold text-foreground">
            Visit summary
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-secondary">
            Latest operational check-ins for {summary.membershipName}. Full
            audit logs remain admin-only.
          </p>
        </div>
        <span className="rounded-full bg-soft-blue px-3 py-1.5 text-sm font-bold text-primary-active">
          {summary.totalVisits} visit{summary.totalVisits === 1 ? "" : "s"}
        </span>
      </div>

      {summary.visits.length ? (
        <ol className="mt-5 divide-y divide-border border-y border-border">
          {summary.visits.map((visit) => (
            <li
              className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
              key={visit.id}
            >
              <div>
                <p className="font-bold text-foreground">
                  {displayDateTime(visit.checkedInAt)}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary-active">
                  Duration {displayDuration(visit.checkedInAt, visit.checkedOutAt)}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-secondary">
                  {visit.serviceSummaries.map((serviceSummary) => (
                    <li key={serviceSummary}>{serviceSummary}</li>
                  ))}
                </ul>
              </div>
              <p className="text-sm font-semibold text-secondary">
                {visit.checkedOutAt
                  ? `Checked out ${displayDateTime(visit.checkedOutAt)}`
                  : "Open visit"}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8 text-sm text-secondary">
          No visits are recorded during the current membership period.
        </p>
      )}
    </section>
  );
}

export function RegistrationCustomerCard({
  compact,
  currentMembershipVisitSummary,
  customer,
  recentActivity,
  showAllPackages,
}: {
  compact: boolean;
  currentMembershipVisitSummary: RegistrationCurrentMembershipVisitSummary | null;
  customer: CustomerCardValue;
  recentActivity: CustomerRecentActivityItem[];
  showAllPackages: boolean;
}) {
  const now = new Date();
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const activePackages = customer.packages.filter(
    (customerPackage) =>
      customerPackage.status === "ACTIVE" &&
      customerPackage.expirationDate >= today,
  );
  const visiblePackages = showAllPackages ? customer.packages : activePackages;
  const hiddenPackageCount = customer.packages.length - activePackages.length;
  const togglePath = `/registration?customer=${encodeURIComponent(customer.customerCode)}${showAllPackages ? "" : "&showAll=1"}${compact ? "&view=compact" : ""}`;
  const activeMemberships = customer.packages.filter(
    (customerPackage) => customerPackage.status === "ACTIVE",
  );
  const frozenMemberships = customer.packages.filter(
    (customerPackage) =>
      customerPackage.status === "FROZEN" ||
      hasBlockingFreeze(
        customerPackage.freezes.filter(
          (freeze) => !freeze.customerPackageServiceId,
        ),
        now,
      ),
  );
  const activeMembership =
    activeMemberships.length === 1 ? activeMemberships[0] : null;
  const activeMembershipHasBlockingFreeze = activeMembership
    ? hasBlockingFreeze(
        activeMembership.freezes.filter(
          (freeze) => !freeze.customerPackageServiceId,
        ),
        now,
      )
    : false;
  const checkInMembership = activeMembership && !activeMembershipHasBlockingFreeze
    ? (() => {
        const isExpired = activeMembership.expirationDate < today;

        return {
          coachName: membershipCoachDisplayName(activeMembership),
          expirationLabel: displayDate(activeMembership.expirationDate),
          id: activeMembership.id,
          isExpired,
          name: membershipDisplayName(activeMembership),
          packageType: membershipTypeDisplayName(activeMembership),
          remainingGuestPasses: activeMembership.remainingGuestPasses,
          services: activeMembership.services
            .filter((service) => service.isActive && !service.deletedAt)
            .map((service) => {
              const serviceStatus = serviceValidityStatus(service, now);

              return {
                coachName: serviceLineCoachDisplayName(service),
                dateRange: `${displayOptionalDate(service.startDate)} - ${displayOptionalDate(service.endDate)}`,
                id: service.id,
                initialSessions: service.initialSessions,
                isUsable: serviceStatus.usable,
                remainingSessions: service.remainingSessions,
                serviceName: serviceLineDisplayName(service),
                statusLabel: serviceStatus.label,
              };
            }),
          timeRestrictionReason: isExpired
            ? null
            : packageTimeRestrictionReason(activeMembership, now),
          timeRule: packageTimeRule(activeMembership),
        };
      })()
    : null;

  return (
    <section
      className="scroll-mt-section space-y-8"
      id="customer-workspace"
    >
      <Card className="animate-panel-in smooth-card overflow-hidden p-0">
        <div className="border-b border-border bg-soft-blue px-5 py-5 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-active">
                Selected customer workspace
              </p>
              <h2 className="mt-2 break-words text-3xl font-bold tracking-tight text-foreground">
                {customer.fullName}
              </h2>
              <p className="mt-2 text-sm font-semibold text-secondary">
                Member ID: {customer.customerCode}
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
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  href="#notes"
                >
                  Add / view notes ({customer.notes.length})
                </a>
                <a
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-neutral px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-hover"
                  href="#packages-sessions"
                >
                  Memberships
                </a>
                {currentMembershipVisitSummary ? (
                  <a
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-neutral px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-hover"
                    href="#current-membership-visits"
                  >
                    Visit summary
                  </a>
                ) : null}
              </div>
            </div>
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <StatusBadge
                  status={customer.status === "ACTIVE" ? "active" : "notInGym"}
                >
                  Customer {customer.status.toLowerCase()}
                </StatusBadge>
                <StatusBadge
                  status={
                    customer.gymPresenceStatus === "IN_GYM"
                      ? "inGym"
                      : "notInGym"
                  }
                >
                  {customer.gymPresenceStatus.toLowerCase().replaceAll("_", " ")}
                </StatusBadge>
              </div>
              <CustomerProfileImagePanel
                customerId={customer.id}
                customerName={customer.fullName}
                hasProfileImage={Boolean(customer.profileImageUrl)}
                mode="registration"
                version={customer.updatedAt.toISOString()}
              />
            </div>
          </div>
        </div>
        <dl className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          <div className="bg-card px-5 py-4 sm:px-6">
            <dt className="text-xs font-bold uppercase tracking-wide text-secondary">
              Birth date
            </dt>
            <dd className="mt-1 font-semibold text-foreground">
              {customer.birthDate
                ? displayDate(customer.birthDate)
                : "Missing birth date"}
            </dd>
          </div>
          <div className="bg-card px-5 py-4 sm:px-6">
            <dt className="text-xs font-bold uppercase tracking-wide text-secondary">
              Phone
            </dt>
            <dd className="mt-1 font-semibold text-foreground">
              {customer.phone ?? "Not provided"}
            </dd>
          </div>
          <div className="bg-card px-5 py-4 sm:px-6">
            <dt className="text-xs font-bold uppercase tracking-wide text-secondary">
              Emergency phone
            </dt>
            <dd className="mt-1 font-semibold text-foreground">
              {customer.emergencyPhone ?? "Not provided"}
            </dd>
          </div>
          <div className="bg-card px-5 py-4 sm:px-6">
            <dt className="text-xs font-bold uppercase tracking-wide text-secondary">
              Assigned coach
            </dt>
            <dd className="mt-1 font-semibold text-foreground">
              {customer.assignedCoach
                ? `${customer.assignedCoach.firstName} ${customer.assignedCoach.lastName}`
                : "Not assigned"}
            </dd>
          </div>
          <div className="bg-card px-5 py-4 sm:px-6">
            <dt className="text-xs font-bold uppercase tracking-wide text-secondary">
              Last check-in
            </dt>
            <dd className="mt-1 font-semibold text-foreground">
              {displayDateTime(customer.lastCheckInAt)}
            </dd>
          </div>
          <div className="bg-card px-5 py-4 sm:px-6">
            <dt className="text-xs font-bold uppercase tracking-wide text-secondary">
              Last check-out
            </dt>
            <dd className="mt-1 font-semibold text-foreground">
              {displayDateTime(customer.lastCheckOutAt)}
            </dd>
          </div>
        </dl>
      </Card>

      <section className="animate-panel-in motion-delay-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Quick action
          </p>
          <h3 className="mt-1 text-2xl font-bold text-foreground">
            {customer.gymPresenceStatus === "NOT_IN_GYM"
              ? "Check in customer"
              : "Check out customer"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-secondary">
            The available action follows the customer&apos;s current gym
            presence status.
          </p>
        </div>
        {customer.gymPresenceStatus === "NOT_IN_GYM" ? (
          <CheckInPanel
            activeMembershipCount={activeMemberships.length}
            compact={compact}
            customerCode={customer.customerCode}
            customerId={customer.id}
            frozenMembershipCount={frozenMemberships.length}
            key={customer.id}
            membership={checkInMembership}
            showAllPackages={showAllPackages}
          />
        ) : (
          <CheckOutPanel
            compact={compact}
            customerCode={customer.customerCode}
            customerId={customer.id}
            showAllPackages={showAllPackages}
          />
        )}
      </section>

      <section
        className="animate-panel-in motion-delay-2 scroll-mt-section"
        id="packages-sessions"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
              Memberships, services, and sessions
            </p>
            <h3 className="mt-1 text-2xl font-bold text-foreground">
              Customer memberships / services
            </h3>
            <p className="mt-1 text-sm leading-6 text-secondary">
              {showAllPackages
                ? "Showing full membership history."
                : "Showing active, unexpired memberships and their service lines."}
            </p>
          </div>
          {customer.packages.length ? (
            <Link
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-neutral px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-hover sm:w-auto"
              href={togglePath}
            >
              {showAllPackages
                ? "Show active memberships"
                : `Show all memberships${hiddenPackageCount ? ` (${hiddenPackageCount} hidden)` : ""}`}
            </Link>
          ) : null}
        </div>

        {visiblePackages.length ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {visiblePackages.map((customerPackage) => {
              const displayStatus = packageStatus(customerPackage, today);
              const usability = packageUsability(customerPackage, now);
              const isExpired = displayStatus.status === "expired";
              const isZero = customerPackage.remainingSessions === 0;
              const packageCoach = membershipCoachDisplayName(customerPackage);
              const activeServiceLines = customerPackage.services.filter(
                (service) => service.isActive && !service.deletedAt,
              );
              const freezeUsage = calculateFreezeUsage(
                customerPackage.freezes,
              );
              const hasFreezeDayRoom = freezeUsage.remainingFreezeDays > 0;
              const membershipFreezes = customerPackage.freezes.filter(
                (freeze) => !freeze.customerPackageServiceId,
              );
              const isFrozen =
                customerPackage.status === "FROZEN" ||
                hasBlockingFreeze(membershipFreezes, now);
              const activeFreeze = customerPackage.freezes.find(
                (freeze) =>
                  freeze.status === "ACTIVE" &&
                  !freeze.customerPackageServiceId,
              );

              return (
                <section
                  className={`animate-panel-in smooth-card flex min-w-0 flex-col rounded-2xl border bg-card p-5 shadow-sm ${isExpired || isZero ? "border-status-high" : usability.usable ? "border-border" : "border-status-medium"}`}
                  key={customerPackage.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-soft-blue px-3 py-1 text-xs font-semibold text-primary-active">
                        {membershipTypeDisplayName(customerPackage)}
                      </span>
                      <h4 className="mt-2 break-words text-xl font-bold text-foreground">
                        {membershipDisplayName(customerPackage)}
                      </h4>
                    </div>
                    <StatusBadge status={displayStatus.status}>
                      {displayStatus.label}
                    </StatusBadge>
                  </div>
                  <div className="mt-5 border-b border-border pb-4">
                    <p
                      className={`text-4xl font-bold ${isZero ? "text-button-danger" : "text-foreground"}`}
                    >
                      {customerPackage.remainingSessions}
                    </p>
                    <p className="mt-1 text-sm text-secondary">
                      remaining sessions
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <p className="w-fit rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
                        Guest passes: {customerPackage.remainingGuestPasses}{" "}
                        remaining
                      </p>
                      <p className="w-fit rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
                        Freeze chances:{" "}
                        {customerPackage.remainingFreezeChances}
                      </p>
                      <p className="w-fit rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
                        Freezes: {freezeUsage.confirmedFreezeCount} /{" "}
                        {MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE}
                      </p>
                      <p className="w-fit rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
                        Freeze days: {freezeUsage.usedFreezeDays} /{" "}
                        {MAX_TOTAL_FREEZE_DAYS_PER_CUSTOMER_PACKAGE}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div>
                      <dt className="font-semibold text-secondary">Expires</dt>
                      <dd
                        className={`mt-1 ${isExpired ? "font-bold text-button-danger" : "text-foreground"}`}
                      >
                        {displayDate(customerPackage.expirationDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-secondary">
                        Time rule
                      </dt>
                      <dd className="mt-1 text-foreground">
                        {packageTimeRule(customerPackage)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-secondary">Coach</dt>
                      <dd className="mt-1 text-foreground">
                        {packageCoach
                          ? packageCoach
                          : "Not assigned"}
                      </dd>
                    </div>
                    {isFrozen ? (
                      <div>
                        <dt className="font-semibold text-secondary">
                          Frozen on
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {customerPackage.frozenAt
                            ? displayDate(customerPackage.frozenAt)
                            : "Date unavailable"}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="mt-4 rounded-xl border border-border bg-page p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground">
                        Active service lines
                      </p>
                      <span className="rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-primary-active">
                        {activeServiceLines.length}
                      </span>
                    </div>
                    {activeServiceLines.length ? (
                      <ul className="mt-3 space-y-2">
                        {activeServiceLines.map((service) => {
                          const serviceStatus = serviceValidityStatus(
                            service,
                            now,
                          );

                          return (
                            <li
                              className="rounded-lg border border-border bg-card px-3 py-3"
                              key={service.id}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="break-words text-sm font-bold text-foreground">
                                    {serviceLineDisplayName(service)}
                                  </p>
                                  {serviceLineCoachDisplayName(service) ? (
                                    <p className="mt-1 text-xs font-semibold text-secondary">
                                      {serviceLineCoachDisplayName(service)}
                                    </p>
                                  ) : null}
                                  <p className="mt-1 text-xs font-semibold text-secondary">
                                    {displayOptionalDate(service.startDate)} -{" "}
                                    {displayOptionalDate(service.endDate)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`text-sm font-bold ${service.remainingSessions === 0 ? "text-button-danger" : "text-foreground"}`}
                                  >
                                    {service.remainingSessions} /{" "}
                                    {service.initialSessions}
                                  </p>
                                  <StatusBadge
                                    className="mt-2 text-xs"
                                    status={serviceStatus.status}
                                  >
                                    {serviceStatus.label}
                                  </StatusBadge>
                                </div>
                              </div>
                              <ServiceSessionStepper
                                compact={compact}
                                customerPackageServiceId={service.id}
                                initialSessions={service.initialSessions}
                                remainingSessions={service.remainingSessions}
                                serviceName={serviceLineDisplayName(service)}
                                showAllPackages={showAllPackages}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-3 rounded-lg border border-dashed border-border bg-card px-3 py-2 text-sm text-secondary">
                        No active service lines in this membership.
                      </p>
                    )}
                  </div>
                  {isFrozen ? (
                    <p className="mt-4 rounded-lg border border-status-medium bg-page px-3 py-2 text-sm font-semibold leading-5 text-foreground">
                      Cannot be used for check-in while frozen.
                    </p>
                  ) : !usability.usable && usability.reason ? (
                    <p className="mt-4 rounded-lg border border-status-medium bg-page px-3 py-2 text-sm font-semibold leading-5 text-foreground">
                      {usability.reason}
                    </p>
                  ) : null}
                  {activeFreeze || hasFreezeDayRoom ? (
                    <p className="mt-4 rounded-lg border border-status-medium bg-page px-3 py-2 text-sm font-semibold leading-5 text-foreground">
                      {activeFreeze
                        ? `Active Admin freeze: ${activeFreeze.plannedDays} planned day${activeFreeze.plannedDays === 1 ? "" : "s"}.`
                        : `${freezeUsage.remainingFreezeDays} freeze day${freezeUsage.remainingFreezeDays === 1 ? "" : "s"} remain for Admin use.`}
                    </p>
                  ) : null}
                  <div className="mt-auto">
                    <SessionStepper
                      compact={compact}
                      customerPackageId={customerPackage.id}
                      remainingSessions={customerPackage.remainingSessions}
                      showAllPackages={showAllPackages}
                    />
                  </div>
                </section>
              );
            })}
          </div>
        ) : customer.packages.length ? (
          <div className="animate-panel-in smooth-panel mt-5 rounded-2xl border border-border bg-card px-5 py-8 shadow-sm">
            <p className="font-semibold text-foreground">
              No active, usable memberships are visible.
            </p>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Inactive, frozen, or expired memberships are hidden from the
              active view.
            </p>
            <Link
              className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand hover:text-primary-hover"
              href={`/registration?customer=${encodeURIComponent(customer.customerCode)}&showAll=1${compact ? "&view=compact" : ""}`}
            >
              Show all memberships
            </Link>
          </div>
        ) : (
          <div className="animate-panel-in smooth-panel mt-5 rounded-2xl border border-border bg-card px-5 py-8 shadow-sm">
            <p className="font-semibold text-foreground">
              This customer has no memberships.
            </p>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Check-in remains available without service deduction when no
              active membership exists.
            </p>
          </div>
        )}
      </section>

      {compact ? (
        <>
          <details
            className="animate-panel-in motion-delay-3 scroll-mt-section"
            id="notes"
            open
          >
            <summary className="smooth-panel min-h-12 cursor-pointer rounded-xl border border-border bg-neutral px-5 py-4 font-bold text-foreground hover:bg-neutral-hover sm:px-6">
              Customer notes ({customer.notes.length}) · reception reminders and internal context
            </summary>
            <div className="mt-4">
              <NotesSection
                customerId={customer.id}
                initialNotes={customer.notes}
              />
            </div>
          </details>
          {currentMembershipVisitSummary ? (
            <details
              className="animate-panel-in motion-delay-4 scroll-mt-section"
              id="current-membership-visits"
            >
              <summary className="smooth-panel min-h-12 cursor-pointer rounded-xl border border-border bg-neutral px-5 py-4 font-bold text-foreground hover:bg-neutral-hover sm:px-6">
                Current membership visits
              </summary>
              <div className="mt-4">
                <CurrentMembershipVisitSummary
                  summary={currentMembershipVisitSummary}
                />
              </div>
            </details>
          ) : null}
          <details
            className="animate-panel-in motion-delay-4 scroll-mt-section"
            id="recent-activity"
          >
            <summary className="smooth-panel min-h-12 cursor-pointer rounded-xl border border-border bg-neutral px-5 py-4 font-bold text-foreground hover:bg-neutral-hover sm:px-6">
              Recent activity
            </summary>
            <div className="mt-4">
              <RecentActivity activity={recentActivity} />
            </div>
          </details>
        </>
      ) : (
        <>
          <div
            className="animate-panel-in motion-delay-3 scroll-mt-section"
            id="notes"
          >
            <NotesSection customerId={customer.id} initialNotes={customer.notes} />
          </div>
          {currentMembershipVisitSummary ? (
            <div
              className="animate-panel-in motion-delay-4 scroll-mt-section"
              id="current-membership-visits"
            >
              <CurrentMembershipVisitSummary
                summary={currentMembershipVisitSummary}
              />
            </div>
          ) : null}
          <div
            className="animate-panel-in motion-delay-4 scroll-mt-section"
            id="recent-activity"
          >
            <RecentActivity activity={recentActivity} />
          </div>
        </>
      )}
    </section>
  );
}
