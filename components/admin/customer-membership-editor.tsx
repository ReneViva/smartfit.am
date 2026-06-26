"use client";

import type { CustomerPackageStatus } from "@prisma/client";
import { useMemo, useState } from "react";

import {
  deactivateCustomerPackageServiceAction,
  saveCustomerMembershipAction,
  saveCustomerPackageServiceAction,
} from "../../app/admin/customers/actions";
import { MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE } from "../../lib/package-freezes";
import { packageTypeLabel } from "../../lib/package-types";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "block text-sm font-semibold text-foreground";

type CoachOption = {
  firstName: string;
  id: string;
  isActive: boolean;
  lastName: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

type PackageOption = {
  assignedCoachId: string | null;
  dailyCheckInLimit: number | null;
  defaultFreezeChances: number;
  defaultGuestPasses: number;
  hasUnlimitedDailyCheckIns: boolean;
  hasUnlimitedIntervalCheckIns: boolean;
  id: string;
  intervalCheckInLimit: number | null;
  isActive: boolean;
  name: string;
  packageType: string;
  sessionCount: number;
};

type ServiceLineValue = {
  category: { name: string } | null;
  categoryId: string | null;
  coach: { firstName: string; lastName: string } | null;
  coachId: string | null;
  id: string;
  initialSessions: number;
  isActive: boolean;
  notes: string | null;
  package: { name: string } | null;
  packageId: string | null;
  remainingSessions: number;
  serviceName: string;
  sortOrder: number;
};

type MembershipValue = {
  activationDate: Date;
  coachId: string | null;
  dailyCheckInLimit: number | null;
  expirationDate: Date;
  hasUnlimitedDailyCheckIns: boolean;
  hasUnlimitedIntervalCheckIns: boolean;
  id: string;
  initialGuestPasses: number;
  initialSessions: number;
  intervalCheckInLimit: number | null;
  package: {
    name: string;
    packageType: string;
  };
  packageId: string;
  remainingFreezeChances: number;
  remainingGuestPasses: number;
  remainingSessions: number;
  services: ServiceLineValue[];
  status: CustomerPackageStatus;
};

type LegacyContainerValue = {
  activationDate: Date;
  expirationDate: Date;
  id: string;
  package: {
    name: string;
    packageType: string;
  };
  status: CustomerPackageStatus;
};

function inputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value);
}

function packageLabel(gymPackage: Pick<PackageOption, "name" | "packageType">) {
  return `${gymPackage.name} - ${packageTypeLabel(gymPackage.packageType)}`;
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
  categories,
  coaches,
  customerId,
  membershipId,
  packages,
  service,
}: {
  categories: CategoryOption[];
  coaches: CoachOption[];
  customerId: string;
  membershipId: string;
  packages: PackageOption[];
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
            required
          />
        </label>
        <label className={labelClass}>
          Source package
          <select
            className={inputClass}
            defaultValue={service?.packageId ?? ""}
            name="servicePackageId"
          >
            <option value="">No package template</option>
            {packages.map((gymPackage) => (
              <option key={gymPackage.id} value={gymPackage.id}>
                {packageLabel(gymPackage)}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Category
          <select
            className={inputClass}
            defaultValue={service?.categoryId ?? ""}
            name="categoryId"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Coach
          <select
            className={inputClass}
            defaultValue={service?.coachId ?? ""}
            name="serviceCoachId"
          >
            <option value="">No service coach</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.firstName} {coach.lastName}
                {coach.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
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
        <Button type="submit">{service ? "Save service line" : "Add service line"}</Button>
        {service ? (
          <Button form={`deactivate-service-${service.id}`} type="submit" variant="danger">
            Deactivate
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function CustomerMembershipEditor({
  activeMembershipConflict,
  categories,
  coaches,
  customerId,
  legacyActiveMemberships,
  membership,
  packages,
}: {
  activeMembershipConflict: boolean;
  categories: CategoryOption[];
  coaches: CoachOption[];
  customerId: string;
  legacyActiveMemberships: LegacyContainerValue[];
  membership: MembershipValue | null;
  packages: PackageOption[];
}) {
  const initialPackage = packages.find(
    (gymPackage) => gymPackage.id === membership?.packageId,
  );
  const [selectedPackageId, setSelectedPackageId] = useState(
    membership?.packageId ?? "",
  );
  const [coachId, setCoachId] = useState(membership?.coachId ?? "");
  const [initialGuestPasses, setInitialGuestPasses] = useState(
    membership?.initialGuestPasses.toString() ??
      initialPackage?.defaultGuestPasses.toString() ??
      "",
  );
  const [remainingGuestPasses, setRemainingGuestPasses] = useState(
    membership?.remainingGuestPasses.toString() ??
      initialPackage?.defaultGuestPasses.toString() ??
      "",
  );
  const [remainingFreezeChances, setRemainingFreezeChances] = useState(
    membership?.remainingFreezeChances.toString() ??
      Math.min(
        initialPackage?.defaultFreezeChances ?? MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE,
        MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE,
      ).toString(),
  );
  const [hasUnlimitedIntervalCheckIns, setHasUnlimitedIntervalCheckIns] =
    useState(
      membership?.hasUnlimitedIntervalCheckIns ??
        initialPackage?.hasUnlimitedIntervalCheckIns ??
        true,
    );
  const [intervalCheckInLimit, setIntervalCheckInLimit] = useState(
    membership?.intervalCheckInLimit?.toString() ??
      initialPackage?.intervalCheckInLimit?.toString() ??
      "",
  );
  const [hasUnlimitedDailyCheckIns, setHasUnlimitedDailyCheckIns] = useState(
    membership?.hasUnlimitedDailyCheckIns ??
      initialPackage?.hasUnlimitedDailyCheckIns ??
      true,
  );
  const [dailyCheckInLimit, setDailyCheckInLimit] = useState(
    membership?.dailyCheckInLimit?.toString() ??
      initialPackage?.dailyCheckInLimit?.toString() ??
      "",
  );
  const activeServices = useMemo(
    () => membership?.services.filter((service) => service.isActive) ?? [],
    [membership],
  );

  function selectPackage(packageId: string) {
    const selected = packages.find((gymPackage) => gymPackage.id === packageId);

    setSelectedPackageId(packageId);
    if (!selected || membership) {
      return;
    }

    const guestPasses = selected.defaultGuestPasses.toString();

    setInitialGuestPasses(guestPasses);
    setRemainingGuestPasses(guestPasses);
    setRemainingFreezeChances(
      Math.min(
        selected.defaultFreezeChances,
        MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE,
      ).toString(),
    );
    setCoachId(selected.assignedCoachId ?? "");
    setHasUnlimitedIntervalCheckIns(selected.hasUnlimitedIntervalCheckIns);
    setIntervalCheckInLimit(selected.intervalCheckInLimit?.toString() ?? "");
    setHasUnlimitedDailyCheckIns(selected.hasUnlimitedDailyCheckIns);
    setDailyCheckInLimit(selected.dailyCheckInLimit?.toString() ?? "");
  }

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
          which legacy package should become the single active container.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {legacyActiveMemberships.map((container) => (
            <div
              className="rounded-lg border border-border bg-card p-4"
              key={container.id}
            >
              <p className="font-bold text-foreground">
                {container.package.name}
              </p>
              <p className="mt-1 text-xs font-semibold text-brand">
                {packageTypeLabel(container.package.packageType)}
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

      <form action={saveCustomerMembershipAction}>
        <input name="customerId" type="hidden" value={customerId} />
        <input name="returnToDetail" type="hidden" value="1" />
        {membership ? (
          <input name="customerPackageId" type="hidden" value={membership.id} />
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className={`${labelClass} md:col-span-2 xl:col-span-1`}>
            Source package template
            <select
              className={inputClass}
              name="packageId"
              onChange={(event) => selectPackage(event.target.value)}
              required
              value={selectedPackageId}
            >
              <option value="">Choose package template</option>
              {packages.map((gymPackage) => (
                <option key={gymPackage.id} value={gymPackage.id}>
                  {packageLabel(gymPackage)}
                  {gymPackage.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
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
            Membership coach
            <select
              className={inputClass}
              name="coachId"
              onChange={(event) => setCoachId(event.target.value)}
              value={coachId}
            >
              <option value="">No membership coach</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.firstName} {coach.lastName}
                  {coach.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
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

        <div className="mt-5">
          <Button disabled={!packages.length || !selectedPackageId} type="submit">
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
                Registration deduction changes come later.
              </p>
            </div>
            <span className="rounded-full bg-soft-blue px-3 py-1 text-sm font-bold text-primary-active">
              {activeServices.length} active
            </span>
          </div>

          {activeServices.length ? (
            <div className="mt-4 space-y-4">
              {activeServices.map((service) => (
                <details
                  className="rounded-xl border border-border bg-page p-4"
                  key={service.id}
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground">
                          {service.serviceName}
                        </p>
                        <p className="mt-1 text-sm text-secondary">
                          {service.remainingSessions} / {service.initialSessions} sessions
                          {service.category ? ` - ${service.category.name}` : ""}
                          {service.coach
                            ? ` - ${service.coach.firstName} ${service.coach.lastName}`
                            : ""}
                        </p>
                      </div>
                      <StatusBadge status="active">active</StatusBadge>
                    </div>
                  </summary>
                  <div className="mt-4 border-t border-border pt-4">
                    <ServiceLineForm
                      categories={categories}
                      coaches={coaches}
                      customerId={customerId}
                      membershipId={membership.id}
                      packages={packages.filter((gymPackage) => gymPackage.isActive)}
                      service={service}
                    />
                    <form
                      action={deactivateCustomerPackageServiceAction}
                      className="hidden"
                      id={`deactivate-service-${service.id}`}
                    >
                      <input name="customerId" type="hidden" value={customerId} />
                      <input name="customerPackageId" type="hidden" value={membership.id} />
                      <input name="serviceId" type="hidden" value={service.id} />
                      <input name="returnToDetail" type="hidden" value="1" />
                    </form>
                  </div>
                </details>
              ))}
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
                categories={categories}
                coaches={coaches}
                customerId={customerId}
                membershipId={membership.id}
                packages={packages.filter((gymPackage) => gymPackage.isActive)}
              />
            </div>
          </details>
        </section>
      ) : null}
    </div>
  );
}
