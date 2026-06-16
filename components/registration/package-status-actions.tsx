"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import {
  freezeCustomerPackageAction,
  reactivateCustomerPackageAction,
} from "../../app/registration/actions";
import { Button } from "../ui/button";

function confirmReactivation(event: FormEvent<HTMLFormElement>) {
  if (
    !window.confirm(
      "Reactivate this package? Expiration will be recalculated from the actual frozen days, and normal package eligibility rules will still apply.",
    )
  ) {
    event.preventDefault();
  }
}

export function PackageStatusActions({
  allowPackageFreeze,
  canFreeze,
  compact,
  customerCode,
  customerId,
  customerPackageId,
  inline = false,
  isFrozen,
  returnPath,
  showAllPackages,
}: {
  allowPackageFreeze: boolean;
  canFreeze: boolean;
  compact: boolean;
  customerCode: string;
  customerId: string;
  customerPackageId: string;
  inline?: boolean;
  isFrozen: boolean;
  returnPath?: string;
  showAllPackages: boolean;
}) {
  const [showFreezeForm, setShowFreezeForm] = useState(false);

  if (!allowPackageFreeze) {
    return null;
  }

  if (!canFreeze && !isFrozen) {
    return null;
  }

  return (
    <div
      className={
        inline
          ? showFreezeForm
            ? "w-full sm:max-w-md"
            : ""
          : "mt-4 border-t border-border pt-4"
      }
    >
      {!inline ? (
        <p className="text-xs font-bold uppercase tracking-wide text-secondary">
          Package status action
        </p>
      ) : null}
      {isFrozen ? (
        <form
          action={reactivateCustomerPackageAction}
          className={inline ? "" : "mt-3"}
          onSubmit={confirmReactivation}
        >
          <input name="customerCode" type="hidden" value={customerCode} />
          <input name="customerId" type="hidden" value={customerId} />
          <input
            name="customerPackageId"
            type="hidden"
            value={customerPackageId}
          />
          <input
            name="showAllPackages"
            type="hidden"
            value={showAllPackages ? "1" : "0"}
          />
          {returnPath ? (
            <input name="returnPath" type="hidden" value={returnPath} />
          ) : null}
          {compact ? <input name="view" type="hidden" value="compact" /> : null}
          <Button className={inline ? "" : "w-full"} type="submit">
            Reactivate package
          </Button>
        </form>
      ) : showFreezeForm ? (
        <form
          action={freezeCustomerPackageAction}
          className="mt-3 w-full min-w-0 rounded-xl border border-status-medium bg-page p-4 sm:max-w-md"
        >
          <input name="customerCode" type="hidden" value={customerCode} />
          <input name="customerId" type="hidden" value={customerId} />
          <input
            name="customerPackageId"
            type="hidden"
            value={customerPackageId}
          />
          {returnPath ? (
            <input name="returnPath" type="hidden" value={returnPath} />
          ) : null}
          {compact ? <input name="view" type="hidden" value="compact" /> : null}
          <label className="block text-sm font-semibold text-foreground">
            Freeze duration
            <span className="mt-1 block font-normal leading-5 text-secondary">
              How many days do you want to freeze this package?
            </span>
            <input
              className="mt-3 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
              defaultValue={1}
              inputMode="numeric"
              min={1}
              name="freezeDays"
              required
              step={1}
              type="number"
            />
          </label>
          <p className="mt-2 text-xs leading-5 text-secondary">
            Expiration is planned from this duration and recalculated if the
            package is reactivated early.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" variant="warning">
              Confirm freeze
            </Button>
            <Button
              onClick={() => setShowFreezeForm(false)}
              type="button"
              variant="neutral"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          aria-expanded={showFreezeForm}
          className={inline ? "" : "mt-3 w-full"}
          onClick={() => setShowFreezeForm(true)}
          type="button"
          variant="warning"
        >
          Freeze package
        </Button>
      )}
    </div>
  );
}
