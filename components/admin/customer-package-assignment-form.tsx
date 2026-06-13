"use client";

import { CustomerPackageStatus } from "@prisma/client";
import { useState } from "react";

import { assignCustomerPackageAction } from "../../app/admin/customers/actions";
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
  id: string;
  name: string;
  packageType: string;
  sessionCount: number;
};

export function CustomerPackageAssignmentForm({
  coaches,
  customerId,
  packages,
}: {
  coaches: CoachOption[];
  customerId: string;
  packages: PackageOption[];
}) {
  const [initialSessions, setInitialSessions] = useState("");
  const [remainingSessions, setRemainingSessions] = useState("");
  const [coachId, setCoachId] = useState("");

  return (
    <form action={assignCustomerPackageAction}>
      <input name="customerId" type="hidden" value={customerId} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <label className={`${labelClass} md:col-span-2 xl:col-span-1`}>
          Active package definition
          <select
            className={inputClass}
            name="packageId"
            onChange={(event) => {
              const selectedPackage = packages.find(
                (gymPackage) => gymPackage.id === event.target.value,
              );
              const sessions = selectedPackage?.sessionCount.toString() ?? "";

              setInitialSessions(sessions);
              setRemainingSessions(sessions);
              setCoachId(selectedPackage?.assignedCoachId ?? "");
            }}
            required
          >
            <option value="">Select package</option>
            {packages.map((gymPackage) => (
              <option key={gymPackage.id} value={gymPackage.id}>
                {gymPackage.name} ({gymPackage.packageType},{" "}
                {gymPackage.sessionCount} sessions)
              </option>
            ))}
          </select>
        </label>
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
        Selecting a package prefills its session count. Adjust either session
        value before saving when needed. Assigning again creates a new package
        history record.
      </p>
      <Button className="mt-5" disabled={!packages.length} type="submit">
        Assign package
      </Button>
    </form>
  );
}
