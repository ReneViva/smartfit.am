"use client";

import type { FormEvent } from "react";

import {
  freezeCustomerPackageAction,
  reactivateCustomerPackageAction,
} from "../../app/registration/actions";
import { Button } from "../ui/button";

function confirmFreeze(event: FormEvent<HTMLFormElement>) {
  if (
    !window.confirm(
      "Freeze this package? It cannot be used for check-in until it is reactivated. Expiration and sessions will not change.",
    )
  ) {
    event.preventDefault();
  }
}

function confirmReactivation(event: FormEvent<HTMLFormElement>) {
  if (
    !window.confirm(
      "Reactivate this package? Expiration and sessions will not change, and normal package eligibility rules will still apply.",
    )
  ) {
    event.preventDefault();
  }
}

export function PackageStatusActions({
  canFreeze,
  compact,
  customerCode,
  customerId,
  customerPackageId,
  isFrozen,
  showAllPackages,
}: {
  canFreeze: boolean;
  compact: boolean;
  customerCode: string;
  customerId: string;
  customerPackageId: string;
  isFrozen: boolean;
  showAllPackages: boolean;
}) {
  if (!canFreeze && !isFrozen) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-secondary">
        Package status action
      </p>
      {isFrozen ? (
        <form
          action={reactivateCustomerPackageAction}
          className="mt-3"
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
          {compact ? <input name="view" type="hidden" value="compact" /> : null}
          <Button className="w-full" type="submit">
            Reactivate package
          </Button>
        </form>
      ) : (
        <form
          action={freezeCustomerPackageAction}
          className="mt-3"
          onSubmit={confirmFreeze}
        >
          <input name="customerCode" type="hidden" value={customerCode} />
          <input name="customerId" type="hidden" value={customerId} />
          <input
            name="customerPackageId"
            type="hidden"
            value={customerPackageId}
          />
          {compact ? <input name="view" type="hidden" value="compact" /> : null}
          <Button className="w-full" type="submit" variant="warning">
            Freeze package
          </Button>
        </form>
      )}
    </div>
  );
}
