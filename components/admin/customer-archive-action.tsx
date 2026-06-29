"use client";

import { archiveCustomerAction } from "../../app/admin/customers/actions";
import { Button } from "../ui/button";

export function CustomerArchiveAction({
  customerCode,
  customerId,
  customerName,
  hasOpenVisit,
  isInGym,
}: {
  customerCode: string;
  customerId: string;
  customerName: string;
  hasOpenVisit: boolean;
  isInGym: boolean;
}) {
  const blocked = isInGym || hasOpenVisit;

  return (
    <div className="mt-5 rounded-xl border border-status-medium bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">
            Archive customer
          </p>
          <p className="mt-1 text-sm leading-6 text-secondary">
            Keeps visits, memberships, notes, documents, and logs, but hides
            this profile from normal active lists.
          </p>
          {blocked ? (
            <p className="mt-2 text-sm font-semibold text-button-danger">
              Check out this customer and close open visits before archiving.
            </p>
          ) : null}
        </div>
        <form
          action={archiveCustomerAction}
          onSubmit={(event) => {
            if (
              !window.confirm(
                `Archive ${customerCode}: ${customerName}? This hides the profile from normal Admin and Registration lists, but keeps operational history.`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input name="customerId" type="hidden" value={customerId} />
          <Button pendingLabel="Archiving..." type="submit" variant="danger">
            Archive customer
          </Button>
        </form>
      </div>
    </div>
  );
}
