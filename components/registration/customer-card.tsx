import type {
  CustomerPackageStatus,
  CustomerStatus,
  GymPresenceStatus,
} from "@prisma/client";
import Link from "next/link";

import { packageUsability } from "../../lib/registration/package-usability";
import type { CustomerNoteView } from "../../lib/notes";
import { Card } from "../ui/card";
import { StatusBadge } from "../ui/status-badge";
import { CheckInPanel } from "./check-in-panel";
import { CheckOutPanel } from "./check-out-panel";
import { NotesSection } from "./notes-section";
import { SessionStepper } from "./session-stepper";

type PackageCardValue = {
  coach: {
    firstName: string;
    lastName: string;
  } | null;
  expirationDate: Date;
  id: string;
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
    timeRestrictionLabel: string | null;
  };
  remainingSessions: number;
  status: CustomerPackageStatus;
};

type CustomerCardValue = {
  assignedCoach: {
    firstName: string;
    lastName: string;
  } | null;
  customerCode: string;
  fullName: string;
  gymPresenceStatus: GymPresenceStatus;
  id: string;
  notes: CustomerNoteView[];
  packages: PackageCardValue[];
  status: CustomerStatus;
};

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value);
}

function packageTimeRule(customerPackage: PackageCardValue) {
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

export function RegistrationCustomerCard({
  customer,
  showAllPackages,
}: {
  customer: CustomerCardValue;
  showAllPackages: boolean;
}) {
  const now = new Date();
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const activePackages = customer.packages.filter(
    (customerPackage) =>
      customerPackage.status === "ACTIVE" &&
      customerPackage.expirationDate >= today &&
      customerPackage.remainingSessions > 0,
  );
  const visiblePackages = showAllPackages ? customer.packages : activePackages;
  const hiddenPackageCount = customer.packages.length - activePackages.length;
  const togglePath = `/registration?customer=${encodeURIComponent(customer.customerCode)}${showAllPackages ? "" : "&showAll=1"}`;
  const checkInPackages = customer.packages.map((customerPackage) => {
    const usability = packageUsability(customerPackage, now);
    const packageCoach =
      customerPackage.coach ?? customerPackage.package.assignedCoach;

    return {
      coachName: packageCoach
        ? `${packageCoach.firstName} ${packageCoach.lastName}`
        : null,
      expirationLabel: displayDate(customerPackage.expirationDate),
      id: customerPackage.id,
      name: customerPackage.package.name,
      reason: usability.reason,
      remainingSessions: customerPackage.remainingSessions,
      timeRule: packageTimeRule(customerPackage),
      usable: usability.usable,
    };
  });

  return (
    <Card className="mt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand">
            Member ID: {customer.customerCode}
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {customer.fullName}
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Assigned coach:{" "}
            {customer.assignedCoach
              ? `${customer.assignedCoach.firstName} ${customer.assignedCoach.lastName}`
              : "Not assigned"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            status={customer.status === "ACTIVE" ? "active" : "notInGym"}
          >
            Customer {customer.status.toLowerCase()}
          </StatusBadge>
          <StatusBadge
            status={
              customer.gymPresenceStatus === "IN_GYM" ? "inGym" : "notInGym"
            }
          >
            {customer.gymPresenceStatus.toLowerCase().replaceAll("_", " ")}
          </StatusBadge>
        </div>
      </div>

      {customer.gymPresenceStatus === "NOT_IN_GYM" ? (
        <CheckInPanel
          customerCode={customer.customerCode}
          customerId={customer.id}
          packages={checkInPackages}
        />
      ) : (
        <CheckOutPanel
          customerCode={customer.customerCode}
          customerId={customer.id}
          showAllPackages={showAllPackages}
        />
      )}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Packages</h3>
          <p className="mt-1 text-sm text-secondary">
            {showAllPackages
              ? "Showing full package history."
              : "Showing active, unexpired packages with remaining sessions."}
          </p>
        </div>
        {customer.packages.length ? (
          <Link
            className="inline-flex min-h-10 items-center rounded-lg bg-neutral px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-hover"
            href={togglePath}
          >
            {showAllPackages
              ? "Show active packages"
              : `Show all packages${hiddenPackageCount ? ` (${hiddenPackageCount} hidden)` : ""}`}
          </Link>
        ) : null}
      </div>

      {visiblePackages.length ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visiblePackages.map((customerPackage) => {
            const displayStatus = packageStatus(customerPackage, today);
            const isExpired = displayStatus.status === "expired";
            const isZero = customerPackage.remainingSessions === 0;
            const packageCoach =
              customerPackage.coach ?? customerPackage.package.assignedCoach;

            return (
              <section
                className={`rounded-2xl border p-5 ${isExpired || isZero ? "border-status-high bg-card" : customerPackage.status === "FROZEN" ? "border-status-medium bg-card" : "border-border bg-page"}`}
                key={customerPackage.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="text-xl font-bold text-foreground">
                    {customerPackage.package.name}
                  </h4>
                  <StatusBadge status={displayStatus.status}>
                    {displayStatus.label}
                  </StatusBadge>
                </div>
                <p
                  className={`mt-5 text-4xl font-bold ${isZero ? "text-button-danger" : "text-foreground"}`}
                >
                  {customerPackage.remainingSessions}
                </p>
                <p className="mt-1 text-sm text-secondary">
                  remaining sessions
                </p>
                {isZero ? (
                  <StatusBadge className="mt-3" status="expired">
                    Zero sessions
                  </StatusBadge>
                ) : null}
                <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                  <div>
                    <dt className="font-semibold text-secondary">Expires</dt>
                    <dd
                      className={`mt-1 ${isExpired ? "font-bold text-button-danger" : "text-foreground"}`}
                    >
                      {displayDate(customerPackage.expirationDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-secondary">Time rule</dt>
                    <dd className="mt-1 text-foreground">
                      {packageTimeRule(customerPackage)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-secondary">Coach</dt>
                    <dd className="mt-1 text-foreground">
                      {packageCoach
                        ? `${packageCoach.firstName} ${packageCoach.lastName}`
                        : "Not assigned"}
                    </dd>
                  </div>
                </dl>
                <SessionStepper
                  customerPackageId={customerPackage.id}
                  remainingSessions={customerPackage.remainingSessions}
                  showAllPackages={showAllPackages}
                />
              </section>
            );
          })}
        </div>
      ) : customer.packages.length ? (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center">
          <p className="font-semibold text-foreground">
            No active, usable packages are visible.
          </p>
          <p className="mt-2 text-sm text-secondary">
            Inactive, frozen, expired, or zero-session packages are hidden.
          </p>
          <Link
            className="mt-4 inline-flex font-semibold text-brand hover:text-primary-hover"
            href={`/registration?customer=${encodeURIComponent(customer.customerCode)}&showAll=1`}
          >
            Show all packages
          </Link>
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center text-secondary">
          This customer has no packages.
        </p>
      )}

      <NotesSection customerId={customer.id} initialNotes={customer.notes} />
    </Card>
  );
}
