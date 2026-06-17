"use client";

import { CustomerPackageStatus } from "@prisma/client";
import { useMemo, useState } from "react";

import { assignCustomerPackageAction } from "../../app/admin/customers/actions";
import { packageTypeKey, packageTypeLabel } from "../../lib/package-types";
import { MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE } from "../../lib/package-freezes";
import { Button } from "../ui/button";

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

type CoachOption = {
  firstName: string;
  id: string;
  lastName: string;
};

type PackageOption = {
  assignedCoachId: string | null;
  defaultFreezeChances: number;
  defaultGuestPasses: number;
  id: string;
  name: string;
  packageType: string;
  sessionCount: number;
};

export function CustomerPackageAssignmentForm({
  coaches,
  customerId,
  packages,
  returnToDetail = false,
}: {
  coaches: CoachOption[];
  customerId: string;
  packages: PackageOption[];
  returnToDetail?: boolean;
}) {
  const [initialSessions, setInitialSessions] = useState("");
  const [remainingSessions, setRemainingSessions] = useState("");
  const [initialGuestPasses, setInitialGuestPasses] = useState("");
  const [remainingGuestPasses, setRemainingGuestPasses] = useState("");
  const [coachId, setCoachId] = useState("");
  const [packageTypeFilter, setPackageTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const packageTypes = useMemo(
    () =>
      Array.from(new Set(packages.map((gymPackage) => gymPackage.packageType)))
        .sort((left, right) =>
          packageTypeLabel(left).localeCompare(packageTypeLabel(right)),
        ),
    [packages],
  );
  const visiblePackages = useMemo(() => {
    const normalizedQuery = packageTypeKey(query);

    return packages.filter((gymPackage) => {
      const matchesType =
        packageTypeFilter === "all" ||
        packageTypeKey(gymPackage.packageType) ===
          packageTypeKey(packageTypeFilter);
      const searchable = packageTypeKey(
        `${gymPackage.name} ${gymPackage.packageType}`,
      );

      return matchesType && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [packageTypeFilter, packages, query]);
  const selectedPackage = packages.find(
    (gymPackage) => gymPackage.id === selectedPackageId,
  );

  function selectPackage(packageId: string) {
    const selected = packages.find((gymPackage) => gymPackage.id === packageId);
    const sessions = selected?.sessionCount.toString() ?? "";
    const guestPasses = selected?.defaultGuestPasses.toString() ?? "";

    setSelectedPackageId(packageId);
    setInitialSessions(sessions);
    setRemainingSessions(sessions);
    setInitialGuestPasses(guestPasses);
    setRemainingGuestPasses(guestPasses);
    setCoachId(selected?.assignedCoachId ?? "");
  }

  function resetAssignment() {
    setInitialSessions("");
    setRemainingSessions("");
    setInitialGuestPasses("");
    setRemainingGuestPasses("");
    setCoachId("");
    setPackageTypeFilter("all");
    setQuery("");
    setSelectedPackageId("");
  }

  return (
    <form
      action={assignCustomerPackageAction}
      onReset={resetAssignment}
    >
      <input name="customerId" type="hidden" value={customerId} />
      <input name="packageId" type="hidden" value={selectedPackageId} />
      {returnToDetail ? (
        <input name="returnToDetail" type="hidden" value="1" />
      ) : null}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2 xl:col-span-3">
          <p className={labelClass}>Active package / service definition</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Search
              <input
                className={inputClass}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Package name or internal type"
                type="search"
                value={query}
              />
            </label>
            <label className={labelClass}>
              Internal type
              <select
                className={inputClass}
                onChange={(event) => setPackageTypeFilter(event.target.value)}
                value={packageTypeFilter}
              >
                <option value="all">All types</option>
                {packageTypes.map((packageType) => (
                  <option key={packageType} value={packageType}>
                    {packageTypeLabel(packageType)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {selectedPackage ? (
            <p className="mt-3 rounded-lg border border-brand bg-soft-blue px-3 py-2 text-sm font-semibold text-foreground">
              Selected: {selectedPackage.name} ·{" "}
              {packageTypeLabel(selectedPackage.packageType)}
            </p>
          ) : null}
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-2">
            {visiblePackages.length ? (
              visiblePackages.map((gymPackage) => (
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors ${
                    selectedPackageId === gymPackage.id
                      ? "border-brand bg-soft-blue"
                      : "border-border bg-page hover:border-brand"
                  }`}
                  key={gymPackage.id}
                >
                  <input
                    checked={selectedPackageId === gymPackage.id}
                    onChange={() => selectPackage(gymPackage.id)}
                    type="radio"
                  />
                  <span className="min-w-0">
                    <span className="block font-bold text-foreground">
                      {gymPackage.name}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-primary-active">
                      {packageTypeLabel(gymPackage.packageType)}
                    </span>
                    <span className="mt-1 block text-sm text-secondary">
                      {gymPackage.sessionCount} sessions ·{" "}
                      {gymPackage.defaultGuestPasses} guest passes,{" "}
                      {Math.min(
                        gymPackage.defaultFreezeChances,
                        MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE,
                      )} freeze chances
                    </span>
                  </span>
                </label>
              ))
            ) : (
              <p className="px-3 py-5 text-center text-sm text-secondary">
                No active packages match this search and internal type.
              </p>
            )}
          </div>
        </div>
        <label className={labelClass}>
          Activation date
          <input
            className={inputClass}
            name="activationDate"
            required
            type="date"
          />
        </label>
        <label className={labelClass}>
          Expiration date
          <input
            className={inputClass}
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
          Package status
          <select
            className={inputClass}
            defaultValue={CustomerPackageStatus.ACTIVE}
            name="status"
            required
          >
            {Object.values(CustomerPackageStatus).map((status) => (
              <option key={status} value={status}>
                {status.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} md:col-span-2 xl:col-span-3`}>
          Package coach
          <select
            className={inputClass}
            name="coachId"
            onChange={(event) => setCoachId(event.target.value)}
            value={coachId}
          >
            <option value="">No package coach</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.firstName} {coach.lastName}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-4 text-sm leading-6 text-secondary">
        Selecting a package or service prefills its session count and guest
        allowance. Adjust assignment values before saving when needed.
        Assigning again creates a separate package history record and keeps
        existing active packages.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          disabled={!packages.length || !selectedPackageId}
          type="submit"
        >
          Assign package / service
        </Button>
        <Button type="reset" variant="neutral">
          Cancel assignment
        </Button>
      </div>
    </form>
  );
}
