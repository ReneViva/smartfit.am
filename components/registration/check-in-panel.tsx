"use client";

import { useState } from "react";

import { checkInAction } from "../../app/registration/actions";
import { Button } from "../ui/button";

type CheckInServiceOption = {
  categoryName: string | null;
  coachName: string | null;
  id: string;
  initialSessions: number;
  remainingSessions: number;
  serviceName: string;
};

type CheckInMembershipOption = {
  coachName: string | null;
  expirationLabel: string;
  id: string;
  isExpired: boolean;
  name: string;
  packageType: string;
  remainingGuestPasses: number;
  services: CheckInServiceOption[];
  timeRestrictionReason: string | null;
  timeRule: string;
};

function parsedDraft(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isSafeInteger(parsedValue) ? parsedValue : null;
}

export function CheckInPanel({
  activeMembershipCount,
  compact,
  customerCode,
  customerId,
  frozenMembershipCount,
  membership,
  returnPath,
  showAllPackages,
}: {
  activeMembershipCount: number;
  compact: boolean;
  customerCode: string;
  customerId: string;
  frozenMembershipCount: number;
  membership: CheckInMembershipOption | null;
  returnPath?: string;
  showAllPackages: boolean;
}) {
  const [serviceDeductions, setServiceDeductions] = useState<
    Record<string, string>
  >({});
  const [guestCount, setGuestCount] = useState("0");
  const services = membership?.services ?? [];
  const hardBlockMessage =
    activeMembershipCount > 1
      ? "This customer has multiple active memberships from older data. Admin must resolve before fast check-in."
      : !membership && frozenMembershipCount > 0
        ? "This membership is frozen and cannot be used for fast check-in."
        : membership?.timeRestrictionReason ?? null;
  const canUseMembership = Boolean(
    membership && !membership.isExpired && !hardBlockMessage,
  );
  const totalServiceDeductions = services.reduce((total, service) => {
    const draft = parsedDraft(serviceDeductions[service.id] ?? "0");

    return total + (draft ?? 0);
  }, 0);
  const hasInvalidServiceDraft = services.some((service) => {
    const draft = parsedDraft(serviceDeductions[service.id] ?? "0");

    return draft === null || draft > service.remainingSessions;
  });
  const parsedGuestCount = parsedDraft(guestCount);
  const occupancyDelta = parsedGuestCount !== null ? 1 + parsedGuestCount : 1;
  const guestControlsAvailable = Boolean(
    membership && canUseMembership && membership.remainingGuestPasses > 0,
  );
  const warningMessage =
    hardBlockMessage ??
    (!membership
      ? "No active membership is available. This check-in will not deduct service sessions."
      : membership.isExpired
        ? "This membership is expired. Check-in is allowed without service or guest-pass deductions."
        : !services.length
          ? "No active service lines are available. This check-in will not deduct service sessions."
          : services.every((service) => service.remainingSessions === 0)
            ? "Active service lines have zero remaining sessions. This check-in will not deduct service sessions."
            : totalServiceDeductions === 0
              ? "No service deduction selected. Check-in is allowed without reducing service sessions."
              : null);

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
        {returnPath ? (
          <input name="returnPath" type="hidden" value={returnPath} />
        ) : null}
        {compact ? <input name="view" type="hidden" value="compact" /> : null}

        {membership ? (
          <div className="rounded-xl border border-border bg-page p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-bold text-foreground">
                  {membership.name}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary-active">
                  {membership.packageType}
                </p>
              </div>
              <p className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-secondary">
                {membership.isExpired ? "expired" : "active"}
              </p>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-secondary sm:grid-cols-2">
              <p>Expires {membership.expirationLabel}</p>
              <p>{membership.timeRule}</p>
              <p>{membership.coachName ?? "No membership coach"}</p>
              <p>{membership.remainingGuestPasses} guest passes remaining</p>
            </div>
          </div>
        ) : null}

        {warningMessage ? (
          <p
            className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold leading-6 ${
              hardBlockMessage
                ? "border-status-high bg-page text-button-danger"
                : "border-status-medium bg-card text-foreground"
            }`}
          >
            {warningMessage}
          </p>
        ) : null}

        {membership && canUseMembership && services.length ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {services.map((service) => {
              const value = serviceDeductions[service.id] ?? "0";
              const draft = parsedDraft(value);
              const isInvalid =
                draft === null || draft > service.remainingSessions;
              const hasRemainingSessions = service.remainingSessions > 0;

              return (
                <div
                  className={`rounded-xl border bg-page p-4 ${isInvalid ? "border-status-high" : "border-border"}`}
                  key={service.id}
                >
                  <input
                    name="customerPackageServiceId"
                    type="hidden"
                    value={service.id}
                  />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-bold text-foreground">
                        {service.serviceName}
                      </p>
                      <p className="mt-1 text-sm text-secondary">
                        {service.categoryName ?? "No category"} -{" "}
                        {service.coachName ?? "no coach"}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-bold ${hasRemainingSessions ? "text-foreground" : "text-button-danger"}`}
                    >
                      {service.remainingSessions} / {service.initialSessions}
                    </p>
                  </div>
                  <label className="mt-4 block text-sm font-semibold text-foreground">
                    Sessions to deduct
                    {hasRemainingSessions ? (
                      <input
                        className="mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
                        max={service.remainingSessions}
                        min="0"
                        name={`serviceDeduction-${service.id}`}
                        onChange={(event) =>
                          setServiceDeductions((current) => ({
                            ...current,
                            [service.id]: event.target.value,
                          }))
                        }
                        required
                        step="1"
                        type="number"
                        value={value}
                      />
                    ) : (
                      <>
                        <input
                          name={`serviceDeduction-${service.id}`}
                          type="hidden"
                          value="0"
                        />
                        <span className="mt-2 flex min-h-11 items-center rounded-lg border border-input-border bg-card px-3 py-2 text-secondary">
                          0
                        </span>
                      </>
                    )}
                  </label>
                  {isInvalid ? (
                    <p className="mt-2 text-sm font-semibold text-button-danger">
                      Enter 0 to {service.remainingSessions}.
                    </p>
                  ) : null}
                  {!hasRemainingSessions ? (
                    <p className="mt-2 text-sm font-semibold text-secondary">
                      Zero remaining; no deduction will be applied.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {guestControlsAvailable && membership ? (
          <div className="mt-5 grid gap-4 rounded-xl border border-border bg-page p-4 sm:grid-cols-2">
            <input
              name="guestSourcePackageId"
              type="hidden"
              value={membership.id}
            />
            <label className="text-sm font-semibold text-foreground">
              Guests entering now
              <input
                className="mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
                max={membership.remainingGuestPasses}
                min="0"
                name="guestCount"
                onChange={(event) => setGuestCount(event.target.value)}
                required
                step="1"
                type="number"
                value={guestCount}
              />
            </label>
            <div className="text-sm leading-6 text-secondary sm:col-span-2">
              <p>
                Guest passes before check-in:{" "}
                <strong className="text-foreground">
                  {membership.remainingGuestPasses}
                </strong>
              </p>
              <p>
                Guest count used:{" "}
                <strong className="text-foreground">{guestCount || "0"}</strong>{" "}
                - Occupancy{" "}
                <strong className="text-foreground">+{occupancyDelta}</strong>
              </p>
            </div>
          </div>
        ) : (
          <input name="guestCount" type="hidden" value="0" />
        )}

        <Button
          className="mt-5 w-full sm:w-auto"
          disabled={Boolean(hardBlockMessage) || hasInvalidServiceDraft}
          type="submit"
          variant="success"
        >
          {hardBlockMessage
            ? "Check-in blocked"
            : totalServiceDeductions > 0
              ? "Check in and deduct services"
              : "Check in without service deduction"}
        </Button>
      </form>
    </section>
  );
}
