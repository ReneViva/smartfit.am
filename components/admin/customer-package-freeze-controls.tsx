"use client";

import type {
  CustomerPackageStatus,
  PackageFreezeMode,
  PackageFreezeStatus,
} from "@prisma/client";

import {
  adminFreezeCustomerPackageAction,
  adminReactivateCustomerPackageAction,
  adminRetroactiveFreezeCustomerPackageAction,
} from "../../app/admin/customers/actions";
import { membershipDisplayName } from "../../lib/customer-memberships";
import {
  calculateActualFrozenDays,
  calculateFreezeUsage,
  getNextFreezeNumber,
  isPaidFreezeNumber,
  MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE,
  MAX_TOTAL_FREEZE_DAYS_PER_CUSTOMER_PACKAGE,
} from "../../lib/package-freezes";
import { Button } from "../ui/button";

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

type ActiveFreezeValue = {
  actualDays: number | null;
  actualEndDate: Date | null;
  createdAt: Date;
  customerPackageServiceId?: string | null;
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

type CustomerPackageFreezeValue = {
  expirationDate: Date;
  freezes: ActiveFreezeValue[];
  id: string;
  membershipName: string | null;
  package: {
    deletedAt: Date | null;
    isActive: boolean;
    name: string;
  } | null;
  remainingFreezeChances: number;
  remainingSessions: number;
  status: CustomerPackageStatus;
};

function displayDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(value)
    : "Not set";
}

function displayDateTime(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value)
    : "Not available";
}

function latestCheckoutDays(latestCompletedCheckoutAt: Date | null) {
  if (!latestCompletedCheckoutAt) {
    return null;
  }

  try {
    const days = calculateActualFrozenDays(
      latestCompletedCheckoutAt,
      new Date(),
    );

    return days > 0 ? days : null;
  } catch {
    return null;
  }
}

function HiddenPackageFields({
  customerCode,
  customerId,
  customerPackageId,
}: {
  customerCode: string;
  customerId: string;
  customerPackageId: string;
}) {
  return (
    <>
      <input name="customerCode" type="hidden" value={customerCode} />
      <input name="customerId" type="hidden" value={customerId} />
      <input name="customerPackageId" type="hidden" value={customerPackageId} />
      <input name="returnToDetail" type="hidden" value="1" />
    </>
  );
}

export function CustomerPackageFreezeControls({
  customerCode,
  customerId,
  customerPackage,
  latestCompletedCheckoutAt,
}: {
  customerCode: string;
  customerId: string;
  customerPackage: CustomerPackageFreezeValue;
  latestCompletedCheckoutAt: Date | null;
}) {
  const activeFreeze =
    customerPackage.freezes.find(
      (freeze) =>
        freeze.status === "ACTIVE" && !freeze.customerPackageServiceId,
    ) ??
    null;
  const freezeUsage = calculateFreezeUsage(customerPackage.freezes);
  const nextFreezeNumber = getNextFreezeNumber(freezeUsage);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const membershipName = membershipDisplayName(customerPackage);
  const packageDefinitionAvailable =
    customerPackage.package
      ? !customerPackage.package.deletedAt && customerPackage.package.isActive
      : true;
  const hasValidFreezeCounter =
    Number.isInteger(customerPackage.remainingFreezeChances) &&
    customerPackage.remainingFreezeChances >= 0;
  const hasFreezeChance = customerPackage.remainingFreezeChances > 0;
  const hasFreezeCountRoom =
    freezeUsage.confirmedFreezeCount < MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE;
  const hasFreezeDayRoom = freezeUsage.remainingFreezeDays > 0;
  const hasCounterMismatch =
    customerPackage.remainingFreezeChances > freezeUsage.remainingFreezeCount;
  const policyAllowsNewFreeze =
    hasValidFreezeCounter &&
    hasFreezeChance &&
    hasFreezeCountRoom &&
    hasFreezeDayRoom &&
    !hasCounterMismatch;
  const hasUsableSessions = customerPackage.remainingSessions > 0;
  const canNormalFreeze =
    !activeFreeze &&
    policyAllowsNewFreeze &&
    hasUsableSessions &&
    packageDefinitionAvailable &&
    customerPackage.status === "ACTIVE" &&
    customerPackage.expirationDate >= today;
  const retroactiveDays = latestCheckoutDays(latestCompletedCheckoutAt);
  const canRetroactiveFreeze =
    !activeFreeze &&
    policyAllowsNewFreeze &&
    hasUsableSessions &&
    packageDefinitionAvailable &&
    (customerPackage.status === "ACTIVE" ||
      customerPackage.status === "EXPIRED");
  const canReactivate =
    Boolean(activeFreeze) && customerPackage.status === "FROZEN";
  const freezeNotice = activeFreeze
    ? `Active freeze reserves ${activeFreeze.plannedDays} planned day${activeFreeze.plannedDays === 1 ? "" : "s"} until reactivation.`
    : !hasValidFreezeCounter
      ? `Freeze counter is invalid. Review ${membershipName} before freezing.`
      : hasCounterMismatch
        ? "Freeze counter needs review before freezing."
        : !hasFreezeChance
          ? "This membership has no remaining freeze chances."
          : !hasFreezeCountRoom
            ? "Maximum 3 freezes already used."
            : !hasFreezeDayRoom
              ? "This membership already used the maximum 30 freeze days."
              : isPaidFreezeNumber(nextFreezeNumber)
                ? `Freeze #${nextFreezeNumber} is paid. Collect payment before confirming.`
                : "Freeze #1 is free.";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
        <p className="rounded-lg bg-page px-3 py-2 text-secondary">
          Remaining freeze chances{" "}
          <strong className="text-foreground">
            {customerPackage.remainingFreezeChances}
          </strong>
        </p>
        <p className="rounded-lg bg-page px-3 py-2 text-secondary">
          Freeze count{" "}
          <strong className="text-foreground">
            {freezeUsage.confirmedFreezeCount} /{" "}
            {MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE}
          </strong>
        </p>
        <p className="rounded-lg bg-page px-3 py-2 text-secondary">
          Freeze days{" "}
          <strong className="text-foreground">
            {freezeUsage.usedFreezeDays} /{" "}
            {MAX_TOTAL_FREEZE_DAYS_PER_CUSTOMER_PACKAGE}
          </strong>
        </p>
        <p className="rounded-lg bg-page px-3 py-2 text-secondary">
          Current expiration{" "}
          <strong className="text-foreground">
            {displayDate(customerPackage.expirationDate)}
          </strong>
        </p>
        <p className="rounded-lg bg-page px-3 py-2 text-secondary">
          Latest checkout{" "}
          <strong className="text-foreground">
            {displayDateTime(latestCompletedCheckoutAt)}
          </strong>
        </p>
      </div>

      <p className="rounded-lg border border-status-medium bg-page px-3 py-2 text-sm font-semibold text-foreground">
        {freezeNotice}{" "}
        {!activeFreeze && hasFreezeDayRoom ? (
          <span className="text-secondary">
            {freezeUsage.remainingFreezeDays} freeze day
            {freezeUsage.remainingFreezeDays === 1 ? "" : "s"} remain.
          </span>
        ) : null}
      </p>

      {!hasFreezeChance ? (
        <p className="rounded-lg border border-status-medium bg-page px-3 py-2 text-sm font-semibold text-foreground">
          This membership has no remaining freeze chances. Edit the membership
          counter before freezing.
        </p>
      ) : null}

      {activeFreeze ? (
        <section className="rounded-xl border border-status-medium bg-page p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-button-warning">
            Active freeze
          </p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-semibold text-secondary">Mode</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {activeFreeze.mode.toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-secondary">Started</dt>
              <dd className="mt-1 text-foreground">
                {displayDateTime(activeFreeze.startDate)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-secondary">Planned days</dt>
              <dd className="mt-1 text-foreground">
                {activeFreeze.plannedDays}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-secondary">Planned end</dt>
              <dd className="mt-1 text-foreground">
                {displayDate(activeFreeze.plannedEndDate)}
              </dd>
            </div>
          </dl>

          {canReactivate ? (
            <form
              action={adminReactivateCustomerPackageAction}
              className="mt-4 border-t border-border pt-4"
            >
              <HiddenPackageFields
                customerCode={customerCode}
                customerId={customerId}
                customerPackageId={customerPackage.id}
              />
              <input
                name="packageFreezeId"
                type="hidden"
                value={activeFreeze.id}
              />
              <label className={labelClass}>
                Reactivation note
                <textarea
                  className={`${inputClass} min-h-20`}
                  maxLength={1000}
                  name="notes"
                  placeholder="Optional context"
                />
              </label>
              <p className="mt-2 text-sm text-secondary">
                Expiration will be recalculated from the original expiration
                plus the actual frozen days.
              </p>
              <Button
                className="mt-4 w-full sm:w-auto"
                pendingLabel="Reactivating..."
                type="submit"
              >
                Reactivate with actual days
              </Button>
            </form>
          ) : (
            <p className="mt-4 rounded-lg border border-status-high bg-card px-3 py-2 text-sm font-semibold text-foreground">
              An active freeze record exists, but this membership is not marked
              frozen. Review the record before changing status.
            </p>
          )}
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <details
          className="smooth-panel rounded-xl border border-border bg-page p-4 open:border-brand"
          open={!activeFreeze}
        >
          <summary className="cursor-pointer list-none font-bold text-foreground">
            Normal planned freeze
          </summary>
          <form action={adminFreezeCustomerPackageAction} className="mt-4">
            <HiddenPackageFields
              customerCode={customerCode}
              customerId={customerId}
              customerPackageId={customerPackage.id}
            />
            <label className={labelClass}>
              Freeze start date
              <input
                className={inputClass}
                defaultValue={new Date().toISOString().slice(0, 10)}
                min={new Date().toISOString().slice(0, 10)}
                name="startDate"
                required
                type="date"
              />
            </label>
            <label className={`${labelClass} mt-3`}>
              Planned days
              <input
                className={inputClass}
                defaultValue={1}
                inputMode="numeric"
                max={freezeUsage.remainingFreezeDays || undefined}
                min={1}
                name="plannedDays"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={`${labelClass} mt-3`}>
              Freeze note
              <textarea
                className={`${inputClass} min-h-20`}
                maxLength={1000}
                name="notes"
                placeholder="Optional context"
              />
            </label>
            <p className="mt-2 text-sm text-secondary">
              Creates an active freeze record, decrements one chance, marks the
              membership frozen when the start date is today, and extends
              expiration by the planned days.
            </p>
            <Button
              className="mt-4 w-full sm:w-auto"
              disabled={!canNormalFreeze}
              pendingLabel="Freezing..."
              type="submit"
              variant="warning"
            >
              Confirm normal freeze
            </Button>
            {!canNormalFreeze ? (
              <p className="mt-3 text-sm font-semibold text-secondary">
                Normal freeze requires an active, unexpired membership with
                remaining sessions, an available legacy package definition when linked, no active
                freeze, at least one freeze chance, fewer than 3 freezes, and
                available days inside the 30-day limit.
              </p>
            ) : null}
          </form>
        </details>

        <details className="smooth-panel rounded-xl border border-border bg-page p-4 open:border-brand">
          <summary className="cursor-pointer list-none font-bold text-foreground">
            Retroactive freeze
          </summary>
          <div className="mt-4 space-y-3">
            <p className="rounded-lg bg-card px-3 py-2 text-sm text-secondary">
              Latest completed checkout:{" "}
              <strong className="text-foreground">
                {displayDateTime(latestCompletedCheckoutAt)}
              </strong>
            </p>
            <p className="rounded-lg bg-card px-3 py-2 text-sm text-secondary">
              Calculated retroactive days:{" "}
              <strong className="text-foreground">
                {retroactiveDays ?? "Unavailable"}
              </strong>
            </p>
            {!latestCompletedCheckoutAt ? (
              <p className="rounded-lg border border-status-medium bg-card px-3 py-2 text-sm font-semibold text-foreground">
                No completed checkout found.
              </p>
            ) : null}
            <form action={adminRetroactiveFreezeCustomerPackageAction}>
              <HiddenPackageFields
                customerCode={customerCode}
                customerId={customerId}
                customerPackageId={customerPackage.id}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  Retroactive start date
                  <input
                    className={inputClass}
                    max={new Date().toISOString().slice(0, 10)}
                    name="retroactiveStartDate"
                    required
                    type="date"
                  />
                </label>
                <label className={labelClass}>
                  Actual frozen days
                  <input
                    className={inputClass}
                    defaultValue={retroactiveDays ?? 1}
                    inputMode="numeric"
                    max={freezeUsage.remainingFreezeDays || undefined}
                    min={1}
                    name="actualDays"
                    required
                    step={1}
                    type="number"
                  />
                </label>
              </div>
              <label className={labelClass}>
                Retroactive note
                <textarea
                  className={`${inputClass} min-h-20`}
                  maxLength={1000}
                  name="notes"
                  placeholder="Optional context"
                />
              </label>
              <p className="mt-2 text-sm text-secondary">
                Creates a completed freeze record, decrements one chance,
                extends expiration by the actual days, and does not leave
                the membership frozen.
              </p>
              <Button
                className="mt-4 w-full sm:w-auto"
                disabled={!canRetroactiveFreeze}
                pendingLabel="Freezing..."
                type="submit"
                variant="warning"
              >
                Confirm retroactive freeze
              </Button>
              {!canRetroactiveFreeze ? (
                <p className="mt-3 text-sm font-semibold text-secondary">
                  Retroactive freeze requires a past start date, positive days,
                  no active membership freeze, remaining sessions, and at least
                  one freeze chance. Days must fit inside the remaining 30-day
                  freeze budget.
                </p>
              ) : null}
            </form>
          </div>
        </details>
      </div>
    </div>
  );
}
