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
import { calculateActualFrozenDays } from "../../lib/package-freezes";
import { Button } from "../ui/button";

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

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

type CustomerPackageFreezeValue = {
  expirationDate: Date;
  freezes: ActiveFreezeValue[];
  id: string;
  package: {
    deletedAt: Date | null;
    isActive: boolean;
    name: string;
  };
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
  const activeFreeze = customerPackage.freezes[0] ?? null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const packageDefinitionAvailable =
    !customerPackage.package.deletedAt && customerPackage.package.isActive;
  const hasFreezeChance = customerPackage.remainingFreezeChances > 0;
  const hasUsableSessions = customerPackage.remainingSessions > 0;
  const canNormalFreeze =
    !activeFreeze &&
    hasFreezeChance &&
    hasUsableSessions &&
    packageDefinitionAvailable &&
    customerPackage.status === "ACTIVE" &&
    customerPackage.expirationDate >= today;
  const retroactiveDays = latestCheckoutDays(latestCompletedCheckoutAt);
  const canRetroactiveFreeze =
    !activeFreeze &&
    hasFreezeChance &&
    hasUsableSessions &&
    packageDefinitionAvailable &&
    (customerPackage.status === "ACTIVE" ||
      customerPackage.status === "EXPIRED") &&
    retroactiveDays !== null;
  const canReactivate =
    Boolean(activeFreeze) && customerPackage.status === "FROZEN";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <p className="rounded-lg bg-page px-3 py-2 text-secondary">
          Remaining freeze chances{" "}
          <strong className="text-foreground">
            {customerPackage.remainingFreezeChances}
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

      {!hasFreezeChance ? (
        <p className="rounded-lg border border-status-medium bg-page px-3 py-2 text-sm font-semibold text-foreground">
          This assignment has no remaining freeze chances. Edit the assignment
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
              <Button className="mt-4 w-full sm:w-auto" type="submit">
                Reactivate with actual days
              </Button>
            </form>
          ) : (
            <p className="mt-4 rounded-lg border border-status-high bg-card px-3 py-2 text-sm font-semibold text-foreground">
              An active freeze record exists, but this assignment is not marked
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
              Planned days
              <input
                className={inputClass}
                defaultValue={1}
                inputMode="numeric"
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
              package frozen, and extends expiration by the planned days.
            </p>
            <Button
              className="mt-4 w-full sm:w-auto"
              disabled={!canNormalFreeze}
              type="submit"
              variant="warning"
            >
              Confirm normal freeze
            </Button>
            {!canNormalFreeze ? (
              <p className="mt-3 text-sm font-semibold text-secondary">
                Normal freeze requires an active, unexpired assignment with
                remaining sessions, an available package definition, no active
                freeze, and at least one freeze chance.
              </p>
            ) : null}
          </form>
        </details>

        <details className="smooth-panel rounded-xl border border-border bg-page p-4 open:border-brand">
          <summary className="cursor-pointer list-none font-bold text-foreground">
            Retroactive freeze from latest checkout
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
                extends expiration by the calculated days, and does not leave
                the package frozen.
              </p>
              <Button
                className="mt-4 w-full sm:w-auto"
                disabled={!canRetroactiveFreeze}
                type="submit"
                variant="warning"
              >
                Confirm retroactive freeze
              </Button>
              {!canRetroactiveFreeze ? (
                <p className="mt-3 text-sm font-semibold text-secondary">
                  Retroactive freeze requires a completed checkout, calculated
                  positive days, no active freeze, remaining sessions, and at
                  least one freeze chance.
                </p>
              ) : null}
            </form>
          </div>
        </details>
      </div>
    </div>
  );
}
