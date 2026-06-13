"use client";

import { useState } from "react";

import { checkInAction } from "../../app/registration/actions";
import { Button } from "../ui/button";

type CheckInPackageOption = {
  coachName: string | null;
  expirationLabel: string;
  id: string;
  name: string;
  reason: string | null;
  remainingSessions: number;
  timeRule: string;
  usable: boolean;
};

export function CheckInPanel({
  customerCode,
  customerId,
  packages,
}: {
  customerCode: string;
  customerId: string;
  packages: CheckInPackageOption[];
}) {
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const usablePackages = packages.filter((gymPackage) => gymPackage.usable);
  const allowsNoPackageCheckIn = usablePackages.length === 0;

  return (
    <section className="mt-8 rounded-2xl border border-brand bg-soft-blue p-5 sm:p-6">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary-active">
        Check in
      </p>
      <h3 className="mt-2 text-2xl font-bold text-foreground">
        Register customer entry
      </h3>

      <form action={checkInAction} className="mt-5">
        <input name="customerCode" type="hidden" value={customerCode} />
        <input name="customerId" type="hidden" value={customerId} />

        {packages.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {packages.map((gymPackage) => (
              <label
                className={`rounded-xl border p-4 ${gymPackage.usable ? "cursor-pointer border-border bg-card" : "cursor-not-allowed border-status-high bg-card opacity-75"}`}
                key={gymPackage.id}
              >
                <div className="flex items-start gap-3">
                  <input
                    checked={selectedPackages.includes(gymPackage.id)}
                    disabled={!gymPackage.usable}
                    name="customerPackageId"
                    onChange={(event) => {
                      setSelectedPackages((currentPackages) =>
                        event.target.checked
                          ? [...currentPackages, gymPackage.id]
                          : currentPackages.filter(
                              (packageId) => packageId !== gymPackage.id,
                            ),
                      );
                    }}
                    type="checkbox"
                    value={gymPackage.id}
                  />
                  <span className="min-w-0">
                    <span className="block font-bold text-foreground">
                      {gymPackage.name}
                    </span>
                    <span className="mt-1 block text-sm text-secondary">
                      {gymPackage.remainingSessions} sessions · Expires{" "}
                      {gymPackage.expirationLabel}
                    </span>
                    <span className="mt-1 block text-sm text-secondary">
                      {gymPackage.timeRule} ·{" "}
                      {gymPackage.coachName ?? "No coach"}
                    </span>
                    {gymPackage.reason ? (
                      <span className="mt-2 block text-sm font-semibold text-button-danger">
                        {gymPackage.reason}
                      </span>
                    ) : null}
                  </span>
                </div>
              </label>
            ))}
          </div>
        ) : null}

        {allowsNoPackageCheckIn ? (
          <p className="mt-5 rounded-xl border border-status-medium bg-card px-4 py-3 text-sm font-semibold text-foreground">
            No usable package is available. This check-in will not deduct
            sessions.
          </p>
        ) : (
          <p className="mt-5 text-sm leading-6 text-secondary">
            Select one or more usable packages. Exactly one session will be
            deducted from each selected package.
          </p>
        )}

        <Button
          className="mt-5"
          disabled={!allowsNoPackageCheckIn && selectedPackages.length === 0}
          type="submit"
          variant="success"
        >
          {allowsNoPackageCheckIn
            ? "Check in without package deduction"
            : "Check in with selected packages"}
        </Button>
      </form>
    </section>
  );
}
