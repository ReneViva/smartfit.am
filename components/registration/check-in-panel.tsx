"use client";

import { useState } from "react";

import { checkInAction } from "../../app/registration/actions";
import { Button } from "../ui/button";

type CheckInPackageOption = {
  coachName: string | null;
  expirationLabel: string;
  id: string;
  name: string;
  packageType: string;
  reason: string | null;
  remainingGuestPasses: number;
  remainingSessions: number;
  timeRule: string;
  usable: boolean;
};

export function CheckInPanel({
  compact,
  customerCode,
  customerId,
  packages,
  showAllPackages,
}: {
  compact: boolean;
  customerCode: string;
  customerId: string;
  packages: CheckInPackageOption[];
  showAllPackages: boolean;
}) {
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState("0");
  const [guestSourcePackageId, setGuestSourcePackageId] = useState("");
  const usablePackages = packages.filter((gymPackage) => gymPackage.usable);
  const allowsNoPackageCheckIn = usablePackages.length === 0;
  const guestSourcePackages = packages.filter(
    (gymPackage) =>
      gymPackage.usable &&
      gymPackage.remainingGuestPasses > 0 &&
      selectedPackages.includes(gymPackage.id),
  );
  const guestSourcePackage = guestSourcePackages.find(
    (gymPackage) => gymPackage.id === guestSourcePackageId,
  );
  const parsedGuestCount = Number(guestCount);
  const occupancyDelta =
    Number.isInteger(parsedGuestCount) && parsedGuestCount >= 0
      ? 1 + parsedGuestCount
      : 1;

  return (
    <section className="mt-4 rounded-2xl border border-brand bg-card p-5 shadow-sm sm:p-6">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary-active">
        Check in
      </p>
      <h3 className="mt-2 text-2xl font-bold text-foreground">
        Register customer entry
      </h3>

      <form action={checkInAction} className="mt-5">
        <input name="customerCode" type="hidden" value={customerCode} />
        <input name="customerId" type="hidden" value={customerId} />
        <input
          name="showAllPackages"
          type="hidden"
          value={showAllPackages ? "1" : "0"}
        />
        {compact ? <input name="view" type="hidden" value="compact" /> : null}

        {packages.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {packages.map((gymPackage) => (
              <label
                className={`rounded-xl border p-4 transition-colors ${gymPackage.usable ? selectedPackages.includes(gymPackage.id) ? "cursor-pointer border-brand bg-soft-blue" : "cursor-pointer border-border bg-page hover:border-brand" : "cursor-not-allowed border-status-high bg-page opacity-75"}`}
                key={gymPackage.id}
              >
                <div className="flex items-start gap-3">
                  <input
                    checked={selectedPackages.includes(gymPackage.id)}
                    disabled={!gymPackage.usable}
                    name="customerPackageId"
                    onChange={(event) => {
                      const nextSelectedPackages = event.target.checked
                        ? [...selectedPackages, gymPackage.id]
                        : selectedPackages.filter(
                            (packageId) => packageId !== gymPackage.id,
                          );
                      const nextGuestSources = packages.filter(
                        (candidate) =>
                          candidate.usable &&
                          candidate.remainingGuestPasses > 0 &&
                          nextSelectedPackages.includes(candidate.id),
                      );
                      const guestSourcesChanged =
                        guestSourcePackages.map(({ id }) => id).join(",") !==
                        nextGuestSources.map(({ id }) => id).join(",");

                      setSelectedPackages(nextSelectedPackages);

                      if (nextGuestSources.length > 1 && guestSourcesChanged) {
                        setGuestSourcePackageId("");
                        setGuestCount("0");
                      } else if (
                        !nextGuestSources.some(
                          (candidate) =>
                            candidate.id === guestSourcePackageId,
                        )
                      ) {
                        setGuestSourcePackageId(
                          nextGuestSources.length === 1
                            ? nextGuestSources[0].id
                            : "",
                        );
                        setGuestCount("0");
                      }
                    }}
                    type="checkbox"
                    value={gymPackage.id}
                  />
                  <span className="min-w-0">
                    <span className="block font-bold text-foreground">
                      {gymPackage.name}
                    </span>
                    <span className="mt-1 inline-flex rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-primary-active">
                      {gymPackage.packageType}
                    </span>
                    <span className="mt-1 block text-sm text-secondary">
                      {gymPackage.remainingSessions} sessions · Expires{" "}
                      {gymPackage.expirationLabel}
                    </span>
                    <span className="mt-1 block text-sm text-secondary">
                      {gymPackage.timeRule} ·{" "}
                      {gymPackage.coachName ?? "No coach"}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-secondary">
                      {gymPackage.remainingGuestPasses} guest pass
                      {gymPackage.remainingGuestPasses === 1 ? "" : "es"}{" "}
                      remaining
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

        {guestSourcePackages.length ? (
          <div className="mt-5 grid gap-4 rounded-xl border border-border bg-page p-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-foreground">
              Guest-pass source package
              <select
                className="mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
                name="guestSourcePackageId"
                onChange={(event) => {
                  setGuestSourcePackageId(event.target.value);
                  setGuestCount("0");
                }}
                required={Number(guestCount) > 0}
                value={guestSourcePackageId}
              >
                <option value="">Choose package</option>
                {guestSourcePackages.map((gymPackage) => (
                  <option key={gymPackage.id} value={gymPackage.id}>
                    {gymPackage.name} · {gymPackage.packageType} (
                    {gymPackage.remainingGuestPasses} remaining)
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-foreground">
              Guests entering now
              <input
                className="mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!guestSourcePackage}
                max={guestSourcePackage?.remainingGuestPasses}
                min="0"
                name="guestCount"
                onChange={(event) => setGuestCount(event.target.value)}
                required
                step="1"
                type="number"
                value={guestCount}
              />
              {!guestSourcePackage ? (
                <input name="guestCount" type="hidden" value="0" />
              ) : null}
            </label>
            <div className="text-sm leading-6 text-secondary sm:col-span-2">
              <p>
                Guest passes before check-in:{" "}
                <strong className="text-foreground">
                  {guestSourcePackage?.remainingGuestPasses ??
                    "Choose a package"}
                </strong>
              </p>
              <p>
                Guest count used:{" "}
                <strong className="text-foreground">{guestCount || "0"}</strong>{" "}
                · Occupancy{" "}
                <strong className="text-foreground">+{occupancyDelta}</strong>
              </p>
            </div>
          </div>
        ) : (
          <input name="guestCount" type="hidden" value="0" />
        )}

        <Button
          className="mt-5 w-full sm:w-auto"
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
