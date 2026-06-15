"use client";

import type {
  CustomerPackageStatus,
  CustomerStatus,
  GymPresenceStatus,
} from "@prisma/client";
import Link from "next/link";

import { StatusBadge } from "../ui/status-badge";
import {
  handleLookupLinkClick,
  useCustomerLookupMotion,
} from "./customer-lookup-motion";

export type RegistrationSearchResult = {
  assignedCoach: {
    firstName: string;
    lastName: string;
  } | null;
  birthDate: Date | null;
  customerCode: string;
  fullName: string;
  gymPresenceStatus: GymPresenceStatus;
  phone: string | null;
  packages: Array<{
    expirationDate: Date;
    remainingSessions: number;
    status: CustomerPackageStatus;
  }>;
  status: CustomerStatus;
};

function resultPath({
  compact,
  customerFilter,
  customerCode,
  query,
  showAllPackages,
  sort,
}: {
  compact: boolean;
  customerFilter: string;
  customerCode: string;
  query: string;
  showAllPackages: boolean;
  sort: string;
}) {
  const params = new URLSearchParams({ customer: customerCode });

  if (query) {
    params.set("q", query);
  }

  if (customerFilter !== "all") {
    params.set("customerFilter", customerFilter);
  }

  if (sort !== "name-asc") {
    params.set("sort", sort);
  }

  if (showAllPackages) {
    params.set("showAll", "1");
  }

  if (compact) {
    params.set("view", "compact");
  }

  return `/registration?${params.toString()}#customer-workspace`;
}

export function CustomerSearchResults({
  compact,
  customerFilter,
  query,
  results,
  selectedCustomerCode,
  showAllPackages,
  sort,
}: {
  compact: boolean;
  customerFilter: string;
  query: string;
  results: RegistrationSearchResult[];
  selectedCustomerCode: string;
  showAllPackages: boolean;
  sort: string;
}) {
  const { isPending, navigate, pendingCustomerCode } =
    useCustomerLookupMotion();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const clearParams = new URLSearchParams();

  if (selectedCustomerCode) {
    clearParams.set("customer", selectedCustomerCode);
  }

  if (compact) {
    clearParams.set("view", "compact");
  }

  if (showAllPackages) {
    clearParams.set("showAll", "1");
  }

  const clearHref = clearParams.size
    ? `/registration?${clearParams.toString()}#search-results`
    : "/registration#search-results";
  const filtered = customerFilter !== "all";
  const visibleSelectedCustomerCode =
    pendingCustomerCode ?? selectedCustomerCode;
  const resultSetKey = `${query}-${customerFilter}-${sort}-${results
    .map((customer) => customer.customerCode)
    .join("-")}`;

  return (
    <section
      aria-busy={isPending}
      className={`animate-soft-enter smooth-panel scroll-mt-section relative rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 ${
        isPending ? "is-route-pending" : ""
      }`}
      id="search-results"
    >
      {isPending ? (
        <p
          className="lookup-pending-label"
          role="status"
        >
          Updating results...
        </p>
      ) : null}

      <div className="lookup-results-content">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
              Matching customers
            </p>
            <h3 className="mt-1 text-2xl font-bold text-foreground">
              Customer results
            </h3>
            <p className="mt-1 text-sm text-secondary">
              {query
                ? `Showing ${results.length} matching customer${results.length === 1 ? "" : "s"}.`
                : filtered
                  ? `Showing ${results.length} filtered customer${results.length === 1 ? "" : "s"}.`
                  : `Showing all customers. ${results.length} customer${results.length === 1 ? "" : "s"} available.`}{" "}
              Select a person to open their workspace.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-brand transition-colors duration-200 hover:text-primary-hover"
            href={clearHref}
            onClick={(event) =>
              handleLookupLinkClick(event, navigate, clearHref)
            }
          >
            Clear search and filters
          </Link>
        </div>

        {results.length ? (
          <div
            className="mt-5 max-h-[min(36rem,65vh)] space-y-3 overflow-y-auto overscroll-contain pr-1"
            key={resultSetKey}
          >
            {results.map((customer, index) => {
            const activePackages = customer.packages.filter(
              (gymPackage) => gymPackage.status === "ACTIVE",
            ).length;
            const hasFrozen = customer.packages.some(
              (gymPackage) => gymPackage.status === "FROZEN",
            );
            const hasExpired = customer.packages.some(
              (gymPackage) =>
                gymPackage.status === "EXPIRED" ||
                gymPackage.expirationDate < today,
            );
            const hasZeroSessions = customer.packages.some(
              (gymPackage) => gymPackage.remainingSessions <= 0,
            );
            const hasNoPackage = customer.packages.length === 0;
            const selected =
              customer.customerCode === visibleSelectedCustomerCode;
            const href = resultPath({
              compact,
              customerFilter,
              customerCode: customer.customerCode,
              query,
              showAllPackages,
              sort,
            });

            return (
              <Link
                aria-current={selected ? "true" : undefined}
                className={`animate-list-item-in group block rounded-xl border p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  selected
                    ? "is-selected-customer border-brand bg-soft-blue shadow-sm"
                    : "border-border bg-page hover:border-brand hover:bg-soft-blue"
                }`}
                href={href}
                key={customer.customerCode}
                onClick={(event) =>
                  handleLookupLinkClick(
                    event,
                    navigate,
                    href,
                    customer.customerCode,
                  )
                }
                style={{
                  animationDelay: `${Math.min(index, 6) * 45}ms`,
                }}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand">
                      Member ID: {customer.customerCode}
                    </p>
                    <h4 className="mt-1 break-words text-lg font-bold text-foreground">
                      {customer.fullName}
                    </h4>
                    <p className="mt-1 text-sm text-secondary">
                      Coach:{" "}
                      {customer.assignedCoach
                        ? `${customer.assignedCoach.firstName} ${customer.assignedCoach.lastName}`
                        : "Not assigned"}
                    </p>
                    {customer.phone ? (
                      <p className="mt-1 text-sm text-secondary">
                        Phone: {customer.phone}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {activePackages} active package
                      {activePackages === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:max-w-[24rem] lg:justify-end">
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
                    <StatusBadge
                      status={customer.status === "ACTIVE" ? "active" : "notInGym"}
                    >
                      {customer.status.toLowerCase()} customer
                    </StatusBadge>
                    {hasNoPackage ? (
                      <StatusBadge status="high">no package</StatusBadge>
                    ) : null}
                    {hasFrozen ? (
                      <StatusBadge status="medium">frozen package</StatusBadge>
                    ) : null}
                    {hasExpired ? (
                      <StatusBadge status="expired">expired package</StatusBadge>
                    ) : null}
                    {hasZeroSessions ? (
                      <StatusBadge status="high">zero sessions</StatusBadge>
                    ) : null}
                    {!customer.birthDate ? (
                      <StatusBadge status="medium">missing birth date</StatusBadge>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 border-t border-border pt-3 text-sm font-semibold text-brand group-hover:text-primary-hover">
                  {selected ? "Currently open" : "Open customer workspace"}
                </p>
              </Link>
            );
            })}
          </div>
        ) : (
          <div className="animate-panel-in mt-5 rounded-xl border border-dashed border-border bg-page px-5 py-8">
            <p className="font-semibold text-foreground">No customers found.</p>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Try another name or member code.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
