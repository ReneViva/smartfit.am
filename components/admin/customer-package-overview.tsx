"use client";

import type {
  CustomerPackageStatus,
  PackageFreezeMode,
  PackageFreezeStatus,
} from "@prisma/client";
import { useMemo, useState } from "react";

import { packageTypeLabel } from "../../lib/package-types";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";
import { CustomerPackageFreezeControls } from "./customer-package-freeze-controls";
import { CustomerPackageEditForm } from "./customer-package-edit-form";

type ActiveFreezeValue = {
  actualDays: number | null;
  actualEndDate: Date | null;
  createdAt: Date;
  id: string;
  mode: PackageFreezeMode;
  notes: string | null;
  originalExpirationDate: Date;
  plannedDays: number;
  plannedEndDate: Date | null;
  resultingExpirationDate: Date | null;
  startDate: Date;
  status: PackageFreezeStatus;
};

type CustomerPackageValue = {
  activationDate: Date;
  coach: {
    firstName: string;
    lastName: string;
  } | null;
  coachId: string | null;
  customerId: string;
  expirationDate: Date;
  frozenAt: Date | null;
  id: string;
  initialGuestPasses: number;
  initialSessions: number;
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
  };
  freezes: ActiveFreezeValue[];
  packageId: string;
  remainingFreezeChances: number;
  remainingGuestPasses: number;
  remainingSessions: number;
  status: CustomerPackageStatus;
  updatedAt: Date;
};

type CoachOption = {
  firstName: string;
  id: string;
  isActive: boolean;
  lastName: string;
};

type PackageOption = {
  id: string;
  isActive: boolean;
  name: string;
  packageType: string;
};

type SelectedPanel = {
  customerPackageId: string;
  mode: "edit" | "freeze";
};

type HistoryFilter =
  | "all"
  | "active"
  | "finished"
  | "expired"
  | "frozen"
  | "inactive";

const historyFilters: { label: string; value: HistoryFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Finished", value: "finished" },
  { label: "Expired", value: "expired" },
  { label: "Frozen", value: "frozen" },
  { label: "Inactive", value: "inactive" },
];

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value);
}

function packageCoach(customerPackage: CustomerPackageValue) {
  const coach =
    customerPackage.coach ?? customerPackage.package.assignedCoach;

  return coach ? `${coach.firstName} ${coach.lastName}` : "Not assigned";
}

function packageTimeRule(customerPackage: CustomerPackageValue) {
  if (!customerPackage.package.hasTimeRestriction) {
    return "All day";
  }

  if (customerPackage.package.timeRestrictionLabel) {
    return customerPackage.package.timeRestrictionLabel;
  }

  if (
    customerPackage.package.allowedStartTime &&
    customerPackage.package.allowedEndTime
  ) {
    return `${customerPackage.package.allowedStartTime} - ${customerPackage.package.allowedEndTime}`;
  }

  return customerPackage.package.allowedEndTime
    ? `Before ${customerPackage.package.allowedEndTime}`
    : "Restricted";
}

function packageState(customerPackage: CustomerPackageValue, today: Date) {
  if (customerPackage.status === "FROZEN") {
    return { badge: "medium" as const, label: "Frozen" };
  }

  if (
    customerPackage.status === "EXPIRED" ||
    customerPackage.expirationDate < today
  ) {
    return { badge: "expired" as const, label: "Expired" };
  }

  if (customerPackage.status === "INACTIVE") {
    return { badge: "notInGym" as const, label: "Inactive" };
  }

  if (customerPackage.remainingSessions === 0) {
    return { badge: "expired" as const, label: "Finished" };
  }

  return { badge: "active" as const, label: "Active" };
}

function isCurrentPackage(
  customerPackage: CustomerPackageValue,
  today: Date,
) {
  if (customerPackage.status === "FROZEN") {
    return true;
  }

  return (
    customerPackage.status === "ACTIVE" &&
    customerPackage.expirationDate >= today &&
    (customerPackage.remainingSessions > 0 ||
      customerPackage.remainingGuestPasses > 0)
  );
}

function matchesHistoryFilter(
  customerPackage: CustomerPackageValue,
  filter: HistoryFilter,
  today: Date,
) {
  switch (filter) {
    case "active":
      return (
        customerPackage.status === "ACTIVE" &&
        customerPackage.expirationDate >= today
      );
    case "finished":
      return customerPackage.remainingSessions === 0;
    case "expired":
      return (
        customerPackage.status === "EXPIRED" ||
        customerPackage.expirationDate < today
      );
    case "frozen":
      return customerPackage.status === "FROZEN";
    case "inactive":
      return customerPackage.status === "INACTIVE";
    default:
      return true;
  }
}

function PackageSummary({
  customerPackage,
}: {
  customerPackage: CustomerPackageValue;
}) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="font-semibold text-secondary">Coach</dt>
        <dd className="mt-1 text-foreground">
          {packageCoach(customerPackage)}
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-secondary">Time rule</dt>
        <dd className="mt-1 text-foreground">
          {packageTimeRule(customerPackage)}
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-secondary">Start date</dt>
        <dd className="mt-1 text-foreground">
          {displayDate(customerPackage.activationDate)}
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-secondary">End date</dt>
        <dd className="mt-1 text-foreground">
          {displayDate(customerPackage.expirationDate)}
        </dd>
      </div>
    </dl>
  );
}

export function CustomerPackageOverview({
  coaches,
  customerCode,
  customerId,
  latestCompletedCheckoutAt,
  packages,
  packageDefinitions,
}: {
  coaches: CoachOption[];
  customerCode: string;
  customerId: string;
  latestCompletedCheckoutAt: Date | null;
  packages: CustomerPackageValue[];
  packageDefinitions: PackageOption[];
}) {
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<SelectedPanel | null>(null);
  const today = useMemo(() => {
    const value = new Date();
    value.setUTCHours(0, 0, 0, 0);
    return value;
  }, []);
  const currentPackages = useMemo(
    () =>
      packages.filter((customerPackage) =>
        isCurrentPackage(customerPackage, today),
      ),
    [packages, today],
  );
  const latestAttentionPackage = useMemo(
    () =>
      packages
        .filter(
          (customerPackage) =>
            customerPackage.remainingSessions === 0 ||
            customerPackage.status === "EXPIRED" ||
            customerPackage.status === "INACTIVE" ||
            customerPackage.expirationDate < today,
        )
        .sort(
          (left, right) =>
            right.expirationDate.getTime() - left.expirationDate.getTime() ||
            right.updatedAt.getTime() - left.updatedAt.getTime(),
        )[0] ?? null,
    [packages, today],
  );
  const filteredHistory = useMemo(
    () =>
      packages.filter((customerPackage) =>
        matchesHistoryFilter(customerPackage, historyFilter, today),
      ),
    [historyFilter, packages, today],
  );
  const visibleHistory = showAllHistory
    ? filteredHistory
    : filteredHistory.slice(0, 10);
  const selectedPackage =
    packages.find(({ id }) => id === selectedPanel?.customerPackageId) ?? null;

  function openSelectedPanel(
    customerPackageId: string,
    mode: "edit" | "freeze",
  ) {
    setSelectedPanel({ customerPackageId, mode });
    window.setTimeout(() => {
      document
        .getElementById("manage-assigned-package")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  if (!packages.length) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center text-sm text-secondary">
        No packages or services are assigned yet. This customer remains valid
        without an active package.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
              Operational access
            </p>
            <h3 className="mt-1 text-2xl font-bold text-foreground">
              Current packages / services
            </h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Healthy active assignments and frozen packages that still need
              operational attention.
            </p>
          </div>
          <span className="rounded-full bg-soft-blue px-3 py-1.5 text-sm font-bold text-primary-active">
            {currentPackages.length} current
          </span>
        </div>

        {currentPackages.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {currentPackages.map((customerPackage) => {
              const state = packageState(customerPackage, today);
              const hasActiveFreeze = customerPackage.freezes.length > 0;

              return (
                <article
                  className="smooth-card rounded-2xl border border-border bg-page p-5 shadow-sm hover:border-brand hover:shadow-md"
                  key={customerPackage.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-soft-blue px-3 py-1 text-xs font-semibold text-primary-active">
                        {packageTypeLabel(
                          customerPackage.package.packageType,
                        )}
                      </span>
                      <h4 className="mt-2 break-words text-xl font-bold text-foreground">
                        {customerPackage.package.name}
                      </h4>
                    </div>
                    <StatusBadge status={state.badge}>
                      {state.label}
                    </StatusBadge>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {customerPackage.remainingSessions}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-secondary">
                        sessions remaining
                      </p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {customerPackage.remainingGuestPasses}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-secondary">
                        guest passes remaining
                      </p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {customerPackage.remainingFreezeChances}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-secondary">
                        freeze chances
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <PackageSummary customerPackage={customerPackage} />
                  </div>

                  {customerPackage.status === "FROZEN" ? (
                    <p className="mt-4 rounded-lg border border-status-medium bg-card px-3 py-2 text-sm font-semibold text-foreground">
                      Frozen packages remain in history and cannot be used for
                      check-in.
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button
                      onClick={() =>
                        openSelectedPanel(customerPackage.id, "edit")
                      }
                      variant="neutral"
                    >
                      Manage
                    </Button>
                    <Button
                      onClick={() =>
                        openSelectedPanel(customerPackage.id, "freeze")
                      }
                      variant={hasActiveFreeze ? "primary" : "warning"}
                    >
                      {hasActiveFreeze ? "Reactivate" : "Freeze options"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center text-sm text-secondary">
            No active or frozen package currently needs prominent placement.
          </p>
        )}
      </section>

      {latestAttentionPackage ? (
        <section className="rounded-2xl border border-status-medium bg-page p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-button-warning">
                Latest package needing attention
              </p>
              <h3 className="mt-2 text-xl font-bold text-foreground">
                {latestAttentionPackage.package.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-primary-active">
                {packageTypeLabel(
                  latestAttentionPackage.package.packageType,
                )}
              </p>
            </div>
            <StatusBadge
              status={packageState(latestAttentionPackage, today).badge}
            >
              {packageState(latestAttentionPackage, today).label}
            </StatusBadge>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
            <p className="rounded-lg bg-card px-3 py-2 text-secondary">
              Ended / ends{" "}
              <strong className="text-foreground">
                {displayDate(latestAttentionPackage.expirationDate)}
              </strong>
            </p>
            <p className="rounded-lg bg-card px-3 py-2 text-secondary">
              Sessions{" "}
              <strong className="text-foreground">
                {latestAttentionPackage.remainingSessions} /{" "}
                {latestAttentionPackage.initialSessions}
              </strong>
            </p>
            <p className="rounded-lg bg-card px-3 py-2 text-secondary">
              Guest passes{" "}
              <strong className="text-foreground">
                {latestAttentionPackage.remainingGuestPasses} /{" "}
                {latestAttentionPackage.initialGuestPasses}
              </strong>
            </p>
            <p className="rounded-lg bg-card px-3 py-2 text-secondary">
              Freeze chances{" "}
              <strong className="text-foreground">
                {latestAttentionPackage.remainingFreezeChances}
              </strong>
            </p>
          </div>
        </section>
      ) : null}

      {selectedPackage ? (
        <section
          className="scroll-mt-6 rounded-2xl border border-brand bg-card p-5 shadow-md sm:p-6"
          id="manage-assigned-package"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                Manage selected assignment
              </p>
              <h3 className="mt-2 text-xl font-bold text-foreground">
                {selectedPackage.package.name}
              </h3>
              <p className="mt-1 text-sm text-secondary">
                Only this package{" "}
                {selectedPanel?.mode === "freeze" ? "freeze panel" : "edit form"}{" "}
                is open.
              </p>
            </div>
            <Button
              onClick={() => setSelectedPanel(null)}
              variant="neutral"
            >
              Close
            </Button>
          </div>
          <div className="mt-5 border-t border-border pt-5">
            {selectedPanel?.mode === "freeze" ? (
              <CustomerPackageFreezeControls
                customerCode={customerCode}
                customerId={customerId}
                customerPackage={selectedPackage}
                latestCompletedCheckoutAt={latestCompletedCheckoutAt}
              />
            ) : (
              <CustomerPackageEditForm
                coaches={coaches}
                customerPackage={selectedPackage}
                packages={packageDefinitions}
                returnToDetail
              />
            )}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
              Complete assignment record
            </p>
            <h3 className="mt-1 text-2xl font-bold text-foreground">
              Package history
            </h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Every assignment is preserved. Newest records appear first.
            </p>
          </div>
          <span className="text-sm font-semibold text-secondary">
            {filteredHistory.length} matching of {packages.length}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group">
          {historyFilters.map((filter) => (
            <button
              className={`min-h-10 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                historyFilter === filter.value
                  ? "border-brand bg-soft-blue text-primary-active"
                  : "border-border bg-card text-secondary hover:border-brand hover:text-foreground"
              }`}
              key={filter.value}
              onClick={() => {
                setHistoryFilter(filter.value);
                setShowAllHistory(false);
              }}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        {visibleHistory.length ? (
          <>
            <div className="mt-5 space-y-3 md:hidden">
              {visibleHistory.map((customerPackage) => {
                const state = packageState(customerPackage, today);

                return (
                  <article
                    className="rounded-xl border border-border bg-page p-4"
                    key={customerPackage.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="break-words font-bold text-foreground">
                          {customerPackage.package.name}
                        </h4>
                        <p className="mt-1 text-xs font-semibold text-primary-active">
                          {packageTypeLabel(
                            customerPackage.package.packageType,
                          )}
                        </p>
                      </div>
                      <StatusBadge className="text-xs" status={state.badge}>
                        {state.label}
                      </StatusBadge>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="font-semibold text-secondary">Dates</dt>
                        <dd className="mt-1 text-foreground">
                          {displayDate(customerPackage.activationDate)}
                          <br />
                          {displayDate(customerPackage.expirationDate)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-secondary">Coach</dt>
                        <dd className="mt-1 text-foreground">
                          {packageCoach(customerPackage)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-secondary">
                          Sessions
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {customerPackage.remainingSessions} /{" "}
                          {customerPackage.initialSessions}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-secondary">
                          Guest passes
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {customerPackage.remainingGuestPasses} /{" "}
                          {customerPackage.initialGuestPasses}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-secondary">
                          Freeze chances
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {customerPackage.remainingFreezeChances}
                        </dd>
                      </div>
                    </dl>
                    <Button
                      className="mt-4 w-full"
                      onClick={() =>
                        openSelectedPanel(customerPackage.id, "edit")
                      }
                      variant="neutral"
                    >
                      Manage
                    </Button>
                    <Button
                      className="mt-2 w-full"
                      onClick={() =>
                        openSelectedPanel(customerPackage.id, "freeze")
                      }
                      variant={
                        customerPackage.freezes.length ? "primary" : "warning"
                      }
                    >
                      {customerPackage.freezes.length
                        ? "Reactivate"
                        : "Freeze options"}
                    </Button>
                  </article>
                );
              })}
            </div>

            <div className="mt-5 hidden overflow-x-auto rounded-xl border border-border md:block">
              <table className="w-full min-w-[76rem] border-collapse text-left text-sm">
                <thead className="bg-page text-xs uppercase tracking-wide text-secondary">
                  <tr>
                    <th className="px-4 py-3">Package / service</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Sessions</th>
                    <th className="px-4 py-3">Guest passes</th>
                    <th className="px-4 py-3">Freeze chances</th>
                    <th className="px-4 py-3">Coach</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleHistory.map((customerPackage) => {
                    const state = packageState(customerPackage, today);

                    return (
                      <tr
                        className="border-t border-border transition-colors hover:bg-soft-blue"
                        key={customerPackage.id}
                      >
                        <td className="px-4 py-4">
                          <p className="font-bold text-foreground">
                            {customerPackage.package.name}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-primary-active">
                            {packageTypeLabel(
                              customerPackage.package.packageType,
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-secondary">
                          {displayDate(customerPackage.activationDate)}
                          <br />
                          {displayDate(customerPackage.expirationDate)}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {customerPackage.remainingSessions} /{" "}
                          {customerPackage.initialSessions}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {customerPackage.remainingGuestPasses} /{" "}
                          {customerPackage.initialGuestPasses}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {customerPackage.remainingFreezeChances}
                        </td>
                        <td className="px-4 py-4 text-secondary">
                          {packageCoach(customerPackage)}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge className="text-xs" status={state.badge}>
                            {state.label}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-4">
                          <Button
                            onClick={() =>
                              openSelectedPanel(customerPackage.id, "edit")
                            }
                            variant="neutral"
                          >
                            Manage
                          </Button>
                          <Button
                            className="mt-2"
                            onClick={() =>
                              openSelectedPanel(customerPackage.id, "freeze")
                            }
                            variant={
                              customerPackage.freezes.length
                                ? "primary"
                                : "warning"
                            }
                          >
                            {customerPackage.freezes.length
                              ? "Reactivate"
                              : "Freeze"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center text-sm text-secondary">
            No package history matches this filter.
          </p>
        )}

        {filteredHistory.length > 10 ? (
          <Button
            className="mt-4 w-full sm:w-auto"
            onClick={() => setShowAllHistory((current) => !current)}
            variant="neutral"
          >
            {showAllHistory
              ? "Show latest 10"
              : `Show all history (${filteredHistory.length})`}
          </Button>
        ) : null}
      </section>
    </div>
  );
}
