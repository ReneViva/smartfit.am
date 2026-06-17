"use client";

import { CustomerPackageStatus } from "@prisma/client";
import { useState } from "react";

import { editCustomerPackageAction } from "../../app/admin/customers/actions";
import { packageTypeLabel } from "../../lib/package-types";
import { MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE } from "../../lib/package-freezes";
import { Button } from "../ui/button";

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

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

type AssignedPackageValue = {
  activationDate: Date;
  coachId: string | null;
  customerId: string;
  expirationDate: Date;
  id: string;
  initialGuestPasses: number;
  initialSessions: number;
  packageId: string;
  remainingFreezeChances: number;
  remainingGuestPasses: number;
  remainingSessions: number;
  status: CustomerPackageStatus;
};

function inputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function CustomerPackageEditForm({
  coaches,
  customerPackage,
  packages,
  returnToDetail = false,
}: {
  coaches: CoachOption[];
  customerPackage: AssignedPackageValue;
  packages: PackageOption[];
  returnToDetail?: boolean;
}) {
  const initialValues = {
    initialGuestPasses: customerPackage.initialGuestPasses.toString(),
    initialSessions: customerPackage.initialSessions.toString(),
    remainingFreezeChances: customerPackage.remainingFreezeChances.toString(),
    remainingGuestPasses: customerPackage.remainingGuestPasses.toString(),
    remainingSessions: customerPackage.remainingSessions.toString(),
  };
  const [initialSessions, setInitialSessions] = useState(
    initialValues.initialSessions,
  );
  const [remainingSessions, setRemainingSessions] = useState(
    initialValues.remainingSessions,
  );
  const [initialGuestPasses, setInitialGuestPasses] = useState(
    initialValues.initialGuestPasses,
  );
  const [remainingGuestPasses, setRemainingGuestPasses] = useState(
    initialValues.remainingGuestPasses,
  );
  const [remainingFreezeChances, setRemainingFreezeChances] = useState(
    initialValues.remainingFreezeChances,
  );

  return (
    <form
      action={editCustomerPackageAction}
      onReset={() => {
        setInitialSessions(initialValues.initialSessions);
        setRemainingSessions(initialValues.remainingSessions);
        setInitialGuestPasses(initialValues.initialGuestPasses);
        setRemainingGuestPasses(initialValues.remainingGuestPasses);
        setRemainingFreezeChances(initialValues.remainingFreezeChances);
      }}
    >
      <input name="customerId" type="hidden" value={customerPackage.customerId} />
      <input
        name="customerPackageId"
        type="hidden"
        value={customerPackage.id}
      />
      {returnToDetail ? (
        <input name="returnToDetail" type="hidden" value="1" />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className={`${labelClass} md:col-span-2 xl:col-span-1`}>
          Package
          <select
            className={inputClass}
            defaultValue={customerPackage.packageId}
            name="packageId"
            required
          >
            {packages.map((gymPackage) => (
              <option
                disabled={
                  !gymPackage.isActive &&
                  gymPackage.id !== customerPackage.packageId
                }
                key={gymPackage.id}
                value={gymPackage.id}
              >
                {gymPackage.name} · {packageTypeLabel(gymPackage.packageType)}
                {gymPackage.isActive ? "" : " (inactive current package)"}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Start date
          <input
            className={inputClass}
            defaultValue={inputDate(customerPackage.activationDate)}
            name="activationDate"
            required
            type="date"
          />
        </label>
        <label className={labelClass}>
          End date
          <input
            className={inputClass}
            defaultValue={inputDate(customerPackage.expirationDate)}
            name="expirationDate"
            required
            type="date"
          />
        </label>
        <label className={labelClass}>
          Initial sessions
          <input
            className={inputClass}
            min={0}
            name="initialSessions"
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
            name="remainingSessions"
            onChange={(event) => setRemainingSessions(event.target.value)}
            required
            step={1}
            type="number"
            value={remainingSessions}
          />
        </label>
        <label className={labelClass}>
          Status
          {customerPackage.status === CustomerPackageStatus.FROZEN ? (
            <>
              <input
                name="status"
                type="hidden"
                value={CustomerPackageStatus.FROZEN}
              />
              <span className={`${inputClass} flex items-center`}>
                frozen (use dedicated reactivation workflow)
              </span>
            </>
          ) : (
            <select
              className={inputClass}
              defaultValue={customerPackage.status}
              name="status"
              required
            >
              {[
                CustomerPackageStatus.ACTIVE,
                CustomerPackageStatus.INACTIVE,
                CustomerPackageStatus.EXPIRED,
              ].map((status) => (
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
          Assigned coach
          <select
            className={inputClass}
            defaultValue={customerPackage.coachId ?? ""}
            name="coachId"
          >
            <option value="">No package coach</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.firstName} {coach.lastName}
                {coach.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
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
          <span className="mt-1 block text-xs font-normal text-secondary">
            Cannot exceed the remaining slots out of{" "}
            {MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE}.
          </span>
        </label>
      </div>
      <p className="mt-4 text-sm leading-6 text-secondary">
        Editing changes this assigned package record. Changing the package
        definition keeps the current dates, sessions, guest passes, and coach
        unless you adjust them here. Remaining freeze chances belong to this
        assignment only and do not reset automatically. Renewal or an
        additional package can still be added separately.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit">Save package changes</Button>
        <Button type="reset" variant="neutral">
          Cancel changes
        </Button>
      </div>
    </form>
  );
}
