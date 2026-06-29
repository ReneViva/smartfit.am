"use client";

import type {
  CustomerPackageStatus,
  PackageFreezeMode,
  PackageFreezeStatus,
} from "@prisma/client";
import { useMemo, useState } from "react";

import {
  adminFreezeCustomerPackageServiceAction,
  adminReactivateCustomerPackageServiceAction,
  adminRetroactiveFreezeCustomerPackageServiceAction,
  deactivateCustomerPackageServiceAction,
  saveCustomerMembershipAction,
  saveCustomerPackageServiceAction,
} from "../../app/admin/customers/actions";
import {
  membershipDisplayName,
  membershipTimeRuleDisplay,
  membershipTypeDisplayName,
  serviceLineCoachDisplayName,
  serviceLineDisplayName,
  serviceValidityStatus,
} from "../../lib/customer-memberships";
import {
  calculateFreezeUsage,
  hasBlockingFreeze,
  MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE,
  MAX_TOTAL_FREEZE_DAYS_PER_CUSTOMER_PACKAGE,
} from "../../lib/package-freezes";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";
import { CustomerPackageFreezeControls } from "./customer-package-freeze-controls";

type FreezeValue = {
  actualDays: number | null;
  actualEndDate: Date | null;
  createdAt: Date;
  customerPackageServiceId?: string | null;
  id: string;
  mode: PackageFreezeMode;
  notes: string | null;
  originalExpirationDate: Date;
  originalServiceEndDate?: Date | null;
  plannedDays: number;
  plannedEndDate: Date | null;
  resultingExpirationDate: Date | null;
  resultingServiceEndDate?: Date | null;
  startDate: Date;
  status: PackageFreezeStatus;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "block text-sm font-semibold text-foreground";

type ServiceLineValue = {
  category: { name: string } | null;
  coach: { firstName: string; lastName: string } | null;
  coachName: string | null;
  endDate: Date | null;
  freezes: FreezeValue[];
  id: string;
  initialSessions: number;
  isActive: boolean;
  notes: string | null;
  package: { name: string } | null;
  remainingSessions: number;
  serviceName: string;
  sortOrder: number;
  startDate: Date | null;
};

type MembershipValue = {
  activationDate: Date;
  allowedEndTime: string | null;
  allowedStartTime: string | null;
  coachId: string | null;
  dailyCheckInLimit: number | null;
  expirationDate: Date;
  hasTimeRestriction: boolean;
  hasUnlimitedDailyCheckIns: boolean;
  hasUnlimitedIntervalCheckIns: boolean;
  id: string;
  membershipName: string | null;
  initialGuestPasses: number;
  initialSessions: number;
  intervalCheckInLimit: number | null;
  package: {
    deletedAt?: Date | null;
    isActive?: boolean;
    name: string;
    packageType: string;
  } | null;
  packageId: string | null;
  freezes: FreezeValue[];
  remainingFreezeChances: number;
  remainingGuestPasses: number;
  remainingSessions: number;
  services: ServiceLineValue[];
  status: CustomerPackageStatus;
  timeRestrictionLabel: string | null;
};

type LegacyContainerValue = {
  activationDate: Date;
  expirationDate: Date;
  id: string;
  membershipName: string | null;
  package: {
    name: string;
    packageType: string;
  } | null;
  status: CustomerPackageStatus;
};

function inputDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value);
}

function displayDateTime(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value)
    : "Not set";
}

function displayOptionalDate(value: Date | null) {
  return value ? displayDate(value) : "Missing date";
}

function statusBadge(status: CustomerPackageStatus) {
  if (status === "FROZEN") {
    return "medium";
  }

  if (status === "EXPIRED") {
    return "expired";
  }

  if (status === "INACTIVE") {
    return "notInGym";
  }

  return "active";
}

function ServiceLineForm({
  customerId,
  membershipEndDate,
  membershipId,
  membershipStartDate,
  service,
}: {
  customerId: string;
  membershipEndDate: Date;
  membershipId: string;
  membershipStartDate: Date;
  service?: ServiceLineValue;
}) {
  const [initialSessions, setInitialSessions] = useState(
    service?.initialSessions.toString() ?? "",
  );
  const [remainingSessions, setRemainingSessions] = useState(
    service?.remainingSessions.toString() ?? "",
  );

  return (
    <form action={saveCustomerPackageServiceAction} className="space-y-4">
      <input name="customerId" type="hidden" value={customerId} />
      <input name="customerPackageId" type="hidden" value={membershipId} />
      <input name="returnToDetail" type="hidden" value="1" />
      {service ? <input name="serviceId" type="hidden" value={service.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className={`${labelClass} md:col-span-2 xl:col-span-1`}>
          Service name
          <input
            className={inputClass}
            defaultValue={service?.serviceName ?? ""}
            maxLength={200}
            name="serviceName"
            placeholder="Gym access, Swimming, or Personal training"
            required
          />
        </label>
        <label className={labelClass}>
          Coach / person
          <input
            className={inputClass}
            defaultValue={service ? serviceLineCoachDisplayName(service) ?? "" : ""}
            maxLength={200}
            name="serviceCoachName"
            placeholder="Davit, Chris, or leave empty"
          />
        </label>
        <label className={labelClass}>
          Service start date
          <input
            className={inputClass}
            defaultValue={inputDate(service?.startDate ?? membershipStartDate)}
            max={inputDate(membershipEndDate)}
            min={inputDate(membershipStartDate)}
            name="serviceStartDate"
            required
            type="date"
          />
        </label>
        <label className={labelClass}>
          Service end date
          <input
            className={inputClass}
            defaultValue={inputDate(service?.endDate ?? membershipEndDate)}
            max={inputDate(membershipEndDate)}
            min={inputDate(membershipStartDate)}
            name="serviceEndDate"
            required
            type="date"
          />
        </label>
        <label className={labelClass}>
          Initial sessions
          <input
            className={inputClass}
            min={0}
            name="serviceInitialSessions"
            onChange={(event) => setInitialSessions(event.target.value)}
            required
            step={1}
            type="number"
            value={initialSessions}
          />
        </label>
        <label className={labelClass}>
          Remaining sessions
          <input
            className={inputClass}
            max={initialSessions || undefined}
            min={0}
            name="serviceRemainingSessions"
            onChange={(event) => setRemainingSessions(event.target.value)}
            required
            step={1}
            type="number"
            value={remainingSessions}
          />
        </label>
        <label className={labelClass}>
          Display order
          <input
            className={inputClass}
            defaultValue={service?.sortOrder ?? 0}
            min={0}
            name="sortOrder"
            step={1}
            type="number"
          />
        </label>
        <label className="mt-2 flex items-center gap-3 rounded-lg bg-page px-4 py-3 text-sm font-semibold text-foreground">
          <input defaultChecked={service?.isActive ?? true} name="isActive" type="checkbox" />
          Active service line
        </label>
        <label className={`${labelClass} md:col-span-2 xl:col-span-3`}>
          Notes
          <textarea
            className={`${inputClass} min-h-24`}
            defaultValue={service?.notes ?? ""}
            maxLength={1000}
            name="serviceNotes"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button pendingLabel="Saving..." type="submit">
          {service ? "Save service line" : "Add service line"}
        </Button>
      </div>
    </form>
  );
}

function ServiceDeactivateForm({
  customerId,
  membershipId,
  serviceId,
}: {
  customerId: string;
  membershipId: string;
  serviceId: string;
}) {
  return (
    <form action={deactivateCustomerPackageServiceAction}>
      <input name="customerId" type="hidden" value={customerId} />
      <input name="customerPackageId" type="hidden" value={membershipId} />
      <input name="serviceId" type="hidden" value={serviceId} />
      <input name="returnToDetail" type="hidden" value="1" />
      <Button pendingLabel="Deactivating..." type="submit" variant="danger">
        Deactivate
      </Button>
    </form>
  );
}

function HiddenServiceFreezeFields({
  customerCode,
  customerId,
  membershipId,
  serviceId,
}: {
  customerCode: string;
  customerId: string;
  membershipId: string;
  serviceId: string;
}) {
  return (
    <>
      <input name="customerCode" type="hidden" value={customerCode} />
      <input name="customerId" type="hidden" value={customerId} />
      <input name="customerPackageId" type="hidden" value={membershipId} />
      <input name="serviceId" type="hidden" value={serviceId} />
      <input name="returnToDetail" type="hidden" value="1" />
    </>
  );
}

function ServiceFreezeControls({
  customerCode,
  customerId,
  membership,
  service,
}: {
  customerCode: string;
  customerId: string;
  membership: MembershipValue;
  service: ServiceLineValue;
}) {
  const activeFreeze =
    service.freezes.find((freeze) => freeze.status === "ACTIVE") ?? null;
  const latestFreeze = service.freezes[0] ?? null;
  const freezeUsage = calculateFreezeUsage(membership.freezes);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const hasValidFreezeCounter =
    Number.isInteger(membership.remainingFreezeChances) &&
    membership.remainingFreezeChances >= 0;
  const policyAllowsNewFreeze =
    hasValidFreezeCounter &&
    membership.remainingFreezeChances > 0 &&
    freezeUsage.remainingFreezeCount > 0 &&
    freezeUsage.remainingFreezeDays > 0;
  const hasServiceDates = Boolean(service.startDate && service.endDate);
  const serviceExpired = Boolean(service.endDate && service.endDate < today);
  const canCreateFreeze =
    !activeFreeze &&
    policyAllowsNewFreeze &&
    membership.status === "ACTIVE" &&
    service.isActive &&
    hasServiceDates &&
    !serviceExpired;
  const canCreateRetroactiveFreeze =
    !activeFreeze &&
    policyAllowsNewFreeze &&
    (membership.status === "ACTIVE" || membership.status === "EXPIRED") &&
    service.isActive &&
    hasServiceDates;
  const freezeBlocksNow = hasBlockingFreeze(service.freezes);

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Service freeze
          </p>
          <p className="mt-1 text-sm text-secondary">
            Uses this membership&apos;s freeze chance pool.{" "}
            {freezeUsage.remainingFreezeDays} freeze day
            {freezeUsage.remainingFreezeDays === 1 ? "" : "s"} remain.
          </p>
        </div>
        <StatusBadge status={freezeBlocksNow ? "medium" : "active"}>
          {freezeBlocksNow ? "frozen now" : "not frozen"}
        </StatusBadge>
      </div>

      {activeFreeze ? (
        <div className="mt-4 rounded-lg border border-status-medium bg-page p-3">
          <p className="text-sm font-bold text-foreground">Active service freeze</p>
          <p className="mt-1 text-sm text-secondary">
            Started {displayDateTime(activeFreeze.startDate)} for{" "}
            {activeFreeze.plannedDays} planned day
            {activeFreeze.plannedDays === 1 ? "" : "s"}.
          </p>
          <form
            action={adminReactivateCustomerPackageServiceAction}
            className="mt-3 border-t border-border pt-3"
          >
            <HiddenServiceFreezeFields
              customerCode={customerCode}
              customerId={customerId}
              membershipId={membership.id}
              serviceId={service.id}
            />
            <input name="packageFreezeId" type="hidden" value={activeFreeze.id} />
            <label className={labelClass}>
              Reactivation note
              <textarea
                className={`${inputClass} min-h-20`}
                maxLength={1000}
                name="notes"
                placeholder="Optional context"
              />
            </label>
            <Button className="mt-3" pendingLabel="Reactivating..." type="submit">
              Reactivate service
            </Button>
          </form>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <form
          action={adminFreezeCustomerPackageServiceAction}
          className="rounded-lg border border-border bg-page p-3"
        >
          <HiddenServiceFreezeFields
            customerCode={customerCode}
            customerId={customerId}
            membershipId={membership.id}
            serviceId={service.id}
          />
          <p className="font-bold text-foreground">Planned/current freeze</p>
          <label className={`${labelClass} mt-3`}>
            Freeze start date
            <input
              className={inputClass}
              defaultValue={new Date().toISOString().slice(0, 10)}
              max={inputDate(service.endDate)}
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
            Note
            <textarea
              className={`${inputClass} min-h-20`}
              maxLength={1000}
              name="notes"
              placeholder="Optional context"
            />
          </label>
          <Button
            className="mt-3"
            disabled={!canCreateFreeze}
            pendingLabel="Freezing..."
            type="submit"
            variant="warning"
          >
            Freeze service
          </Button>
        </form>

        <form
          action={adminRetroactiveFreezeCustomerPackageServiceAction}
          className="rounded-lg border border-border bg-page p-3"
        >
          <HiddenServiceFreezeFields
            customerCode={customerCode}
            customerId={customerId}
            membershipId={membership.id}
            serviceId={service.id}
          />
          <p className="font-bold text-foreground">Retroactive freeze</p>
          <label className={`${labelClass} mt-3`}>
            Retroactive start date
            <input
              className={inputClass}
              max={new Date().toISOString().slice(0, 10)}
              min={inputDate(service.startDate)}
              name="retroactiveStartDate"
              required
              type="date"
            />
          </label>
          <label className={`${labelClass} mt-3`}>
            Actual frozen days
            <input
              className={inputClass}
              defaultValue={1}
              inputMode="numeric"
              max={freezeUsage.remainingFreezeDays || undefined}
              min={1}
              name="actualDays"
              required
              step={1}
              type="number"
            />
          </label>
          <label className={`${labelClass} mt-3`}>
            Note
            <textarea
              className={`${inputClass} min-h-20`}
              maxLength={1000}
              name="notes"
              placeholder="Optional context"
            />
          </label>
          <Button
            className="mt-3"
            disabled={!canCreateRetroactiveFreeze}
            pendingLabel="Freezing..."
            type="submit"
            variant="warning"
          >
            Save retroactive freeze
          </Button>
        </form>
      </div>

      {!canCreateFreeze && !activeFreeze ? (
        <p className="mt-3 text-sm font-semibold text-secondary">
          Service freezing requires active service dates, an active parent
          membership, no active service freeze, and a remaining membership
          freeze chance.
        </p>
      ) : null}

      {latestFreeze ? (
        <div className="mt-4 rounded-lg border border-border bg-page p-3 text-sm text-secondary">
          <p className="font-bold text-foreground">Latest freeze record</p>
          <p className="mt-1">
            {latestFreeze.mode.toLowerCase()} /{" "}
            {latestFreeze.status.toLowerCase()} / {latestFreeze.plannedDays} day
            {latestFreeze.plannedDays === 1 ? "" : "s"}
          </p>
          <p className="mt-1">
            {displayDateTime(latestFreeze.startDate)} -{" "}
            {displayDateTime(
              latestFreeze.actualEndDate ?? latestFreeze.plannedEndDate,
            )}
          </p>
          {latestFreeze.resultingServiceEndDate ? (
            <p className="mt-1">
              Resulting service end:{" "}
              {displayDate(latestFreeze.resultingServiceEndDate)}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function CustomerMembershipEditor({
  activeMembershipConflict,
  customerCode,
  customerId,
  latestCompletedCheckoutAt,
  legacyActiveMemberships,
  membership,
}: {
  activeMembershipConflict: boolean;
  customerCode: string;
  customerId: string;
  latestCompletedCheckoutAt: Date | null;
  legacyActiveMemberships: LegacyContainerValue[];
  membership: MembershipValue | null;
}) {
  const [initialGuestPasses, setInitialGuestPasses] = useState(
    membership?.initialGuestPasses.toString() ?? "0",
  );
  const [remainingGuestPasses, setRemainingGuestPasses] = useState(
    membership?.remainingGuestPasses.toString() ?? "0",
  );
  const [remainingFreezeChances, setRemainingFreezeChances] = useState(
    membership?.remainingFreezeChances.toString() ??
      MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE.toString(),
  );
  const [hasUnlimitedIntervalCheckIns, setHasUnlimitedIntervalCheckIns] =
    useState(membership?.hasUnlimitedIntervalCheckIns ?? true);
  const [intervalCheckInLimit, setIntervalCheckInLimit] = useState(
    membership?.intervalCheckInLimit?.toString() ?? "",
  );
  const [hasUnlimitedDailyCheckIns, setHasUnlimitedDailyCheckIns] = useState(
    membership?.hasUnlimitedDailyCheckIns ?? true,
  );
  const [dailyCheckInLimit, setDailyCheckInLimit] = useState(
    membership?.dailyCheckInLimit?.toString() ?? "",
  );
  const [hasTimeRestriction, setHasTimeRestriction] = useState(
    membership?.hasTimeRestriction ?? false,
  );
  const activeServices = useMemo(
    () => membership?.services.filter((service) => service.isActive) ?? [],
    [membership],
  );

  if (activeMembershipConflict) {
    return (
      <div className="rounded-xl border border-status-high bg-page p-5">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-button-danger">
          Membership conflict
        </p>
        <h3 className="mt-2 text-xl font-bold text-foreground">
          This customer has multiple active membership containers from older data.
        </h3>
        <p className="mt-2 text-sm leading-6 text-secondary">
          Resolve manually before using the new membership editor. No
          membership or service save actions are shown here to avoid guessing
          which legacy membership should become the single active container.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {legacyActiveMemberships.map((container) => (
            <div
              className="rounded-lg border border-border bg-card p-4"
              key={container.id}
            >
              <p className="font-bold text-foreground">
                {membershipDisplayName(container)}
              </p>
              <p className="mt-1 text-xs font-semibold text-brand">
                {membershipTypeDisplayName(container)}
              </p>
              <p className="mt-2 text-sm text-secondary">
                {displayDate(container.activationDate)} -{" "}
                {displayDate(container.expirationDate)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Membership & Services
          </p>
          <h3 className="mt-1 text-2xl font-bold text-foreground">
            {membership ? "Manage active membership" : "Create membership"}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
            One membership container holds the customer&apos;s date range,
            limits, guest passes, freeze counter, and private service/session
            lines.
          </p>
        </div>
        {membership ? (
          <StatusBadge status={statusBadge(membership.status)}>
            {membership.status.toLowerCase()}
          </StatusBadge>
        ) : null}
      </div>

      {membership ? (
        <div className="grid gap-3 rounded-xl border border-border bg-page p-4 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {membership.remainingSessions}
            </p>
            <p className="mt-1 text-xs font-semibold text-secondary">
              service sessions remaining
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {membership.remainingGuestPasses}
            </p>
            <p className="mt-1 text-xs font-semibold text-secondary">
              guest passes remaining
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {membership.remainingFreezeChances}
            </p>
            <p className="mt-1 text-xs font-semibold text-secondary">
              freeze chances
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {activeServices.length}
            </p>
            <p className="mt-1 text-xs font-semibold text-secondary">
              active service lines
            </p>
          </div>
        </div>
      ) : null}
      {membership ? (
        <p className="rounded-xl border border-border bg-page px-4 py-3 text-sm font-semibold text-foreground">
          Time rule:{" "}
          <span className="text-secondary">
            {membershipTimeRuleDisplay(membership)}
          </span>
        </p>
      ) : null}

      {membership ? (
        <details className="rounded-xl border border-border bg-page p-4 open:border-brand">
          <summary className="cursor-pointer list-none font-bold text-foreground">
            Freeze / reactivate membership
          </summary>
          <div className="mt-4 border-t border-border pt-4">
            <CustomerPackageFreezeControls
              customerCode={customerCode}
              customerId={customerId}
              customerPackage={{
                expirationDate: membership.expirationDate,
                freezes: membership.freezes,
                id: membership.id,
                membershipName: membership.membershipName,
                package: membership.package
                  ? {
                      deletedAt: membership.package.deletedAt ?? null,
                      isActive: membership.package.isActive ?? true,
                      name: membership.package.name,
                    }
                  : null,
                remainingFreezeChances: membership.remainingFreezeChances,
                remainingSessions: membership.remainingSessions,
                status: membership.status,
              }}
              latestCompletedCheckoutAt={latestCompletedCheckoutAt}
            />
          </div>
        </details>
      ) : null}

      <form action={saveCustomerMembershipAction}>
        <input name="customerId" type="hidden" value={customerId} />
        <input name="returnToDetail" type="hidden" value="1" />
        {membership ? (
          <input name="customerPackageId" type="hidden" value={membership.id} />
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className={`${labelClass} md:col-span-2 xl:col-span-1`}>
            Membership title
            <input
              className={inputClass}
              defaultValue={membership ? membershipDisplayName(membership) : ""}
              maxLength={200}
              name="membershipName"
              placeholder="1 month / 8 sessions"
              required
            />
          </label>
          <label className={labelClass}>
            Start date
            <input
              className={inputClass}
              defaultValue={membership ? inputDate(membership.activationDate) : ""}
              name="activationDate"
              required
              type="date"
            />
          </label>
          <label className={labelClass}>
            End date
            <input
              className={inputClass}
              defaultValue={membership ? inputDate(membership.expirationDate) : ""}
              name="expirationDate"
              required
              type="date"
            />
          </label>
          <label className={labelClass}>
            Status
            {membership?.status === "FROZEN" ? (
              <>
                <input name="status" type="hidden" value="FROZEN" />
                <span className={`${inputClass} flex items-center`}>
                  frozen (use freeze controls for reactivation)
                </span>
              </>
            ) : (
              <select
                className={inputClass}
                defaultValue={membership?.status ?? "ACTIVE"}
                name="status"
                required
              >
                {["ACTIVE", "INACTIVE", "EXPIRED"].map((status) => (
                  <option key={status} value={status}>
                    {status.toLowerCase()}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className={labelClass}>
            Initial guest passes
            <input
              className={inputClass}
              min={0}
              name="initialGuestPasses"
              onChange={(event) => setInitialGuestPasses(event.target.value)}
              required
              step={1}
              type="number"
              value={initialGuestPasses}
            />
          </label>
          <label className={labelClass}>
            Remaining guest passes
            <input
              className={inputClass}
              max={initialGuestPasses || undefined}
              min={0}
              name="remainingGuestPasses"
              onChange={(event) => setRemainingGuestPasses(event.target.value)}
              required
              step={1}
              type="number"
              value={remainingGuestPasses}
            />
          </label>
          <label className={labelClass}>
            Remaining freeze chances
            <input
              className={inputClass}
              max={MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE}
              min={0}
              name="remainingFreezeChances"
              onChange={(event) => setRemainingFreezeChances(event.target.value)}
              required
              step={1}
              type="number"
              value={remainingFreezeChances}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 rounded-xl border border-border bg-page p-4 lg:grid-cols-2">
          <div>
            <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <input
                checked={hasUnlimitedIntervalCheckIns}
                name="hasUnlimitedIntervalCheckIns"
                onChange={(event) =>
                  setHasUnlimitedIntervalCheckIns(event.target.checked)
                }
                type="checkbox"
              />
              Unlimited check-ins over membership interval
            </label>
            <label className={`${labelClass} mt-3`}>
              Interval check-in limit
              <input
                className={inputClass}
                disabled={hasUnlimitedIntervalCheckIns}
                min={1}
                name="intervalCheckInLimit"
                onChange={(event) => setIntervalCheckInLimit(event.target.value)}
                required={!hasUnlimitedIntervalCheckIns}
                step={1}
                type="number"
                value={intervalCheckInLimit}
              />
            </label>
          </div>
          <div>
            <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <input
                checked={hasUnlimitedDailyCheckIns}
                name="hasUnlimitedDailyCheckIns"
                onChange={(event) =>
                  setHasUnlimitedDailyCheckIns(event.target.checked)
                }
                type="checkbox"
              />
              Unlimited check-ins per day
            </label>
            <label className={`${labelClass} mt-3`}>
              Daily check-in limit
              <input
                className={inputClass}
                disabled={hasUnlimitedDailyCheckIns}
                min={1}
                name="dailyCheckInLimit"
                onChange={(event) => setDailyCheckInLimit(event.target.value)}
                required={!hasUnlimitedDailyCheckIns}
                step={1}
                type="number"
                value={dailyCheckInLimit}
              />
            </label>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-page p-4">
          <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
            <input
              checked={hasTimeRestriction}
              name="hasTimeRestriction"
              onChange={(event) => setHasTimeRestriction(event.target.checked)}
              type="checkbox"
            />
            Use time restriction
          </label>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className={labelClass}>
              Allowed start time
              <input
                className={inputClass}
                defaultValue={membership?.allowedStartTime ?? ""}
                disabled={!hasTimeRestriction}
                name="allowedStartTime"
                type="time"
              />
            </label>
            <label className={labelClass}>
              Allowed end time
              <input
                className={inputClass}
                defaultValue={membership?.allowedEndTime ?? ""}
                disabled={!hasTimeRestriction}
                name="allowedEndTime"
                required={hasTimeRestriction}
                type="time"
              />
            </label>
            <label className={labelClass}>
              Time rule label
              <input
                className={inputClass}
                defaultValue={membership?.timeRestrictionLabel ?? ""}
                disabled={!hasTimeRestriction}
                maxLength={200}
                name="timeRestrictionLabel"
                placeholder="Only before 3 PM"
              />
            </label>
          </div>
          <p className="mt-3 text-sm font-semibold text-secondary">
            {hasTimeRestriction
              ? "Registration blocks check-in outside this membership time window."
              : "No time restriction"}
          </p>
        </div>

        <div className="mt-5">
          <Button
            pendingLabel="Saving..."
            type="submit"
          >
            {membership ? "Save membership" : "Create membership"}
          </Button>
        </div>
      </form>

      {membership ? (
        <section className="border-t border-border pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4 className="text-xl font-bold text-foreground">
                Service/session lines
              </h4>
              <p className="mt-1 text-sm text-secondary">
                These private service balances sit inside the membership.
              </p>
            </div>
            <span className="rounded-full bg-soft-blue px-3 py-1 text-sm font-bold text-primary-active">
              {activeServices.length} active
            </span>
          </div>

          {activeServices.length ? (
            <div className="mt-4 space-y-4">
              {activeServices.map((service) => {
                const serviceStatus = serviceValidityStatus(service);

                return (
                  <details
                    className="rounded-xl border border-border bg-page p-4"
                    key={service.id}
                  >
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-foreground">
                            {serviceLineDisplayName(service)}
                          </p>
                          <p className="mt-1 text-sm text-secondary">
                            {service.remainingSessions} / {service.initialSessions} sessions
                            {serviceLineCoachDisplayName(service)
                              ? ` - ${serviceLineCoachDisplayName(service)}`
                              : ""}
                          </p>
                          <p className="mt-1 text-sm text-secondary">
                            {displayOptionalDate(service.startDate)} -{" "}
                            {displayOptionalDate(service.endDate)}
                          </p>
                          {service.notes ? (
                            <p className="mt-1 text-sm text-secondary">
                              {service.notes}
                            </p>
                          ) : null}
                        </div>
                        <StatusBadge status={serviceStatus.status}>
                          {serviceStatus.label}
                        </StatusBadge>
                      </div>
                    </summary>
                    <div className="mt-4 border-t border-border pt-4">
                      <ServiceLineForm
                        customerId={customerId}
                        membershipEndDate={membership.expirationDate}
                        membershipId={membership.id}
                        membershipStartDate={membership.activationDate}
                        service={service}
                      />
                      <ServiceFreezeControls
                        customerCode={customerCode}
                        customerId={customerId}
                        membership={membership}
                        service={service}
                      />
                      <div className="mt-3">
                        <ServiceDeactivateForm
                          customerId={customerId}
                          membershipId={membership.id}
                          serviceId={service.id}
                        />
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center text-sm text-secondary">
              No active service lines yet.
            </p>
          )}

          <details className="mt-5 rounded-xl border border-border bg-page p-4">
            <summary className="cursor-pointer list-none font-bold text-foreground">
              Add service line
            </summary>
            <div className="mt-4 border-t border-border pt-4">
              <ServiceLineForm
                customerId={customerId}
                membershipEndDate={membership.expirationDate}
                membershipId={membership.id}
                membershipStartDate={membership.activationDate}
              />
            </div>
          </details>
        </section>
      ) : null}
    </div>
  );
}
