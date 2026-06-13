import { CustomerStatus } from "@prisma/client";

import { saveCustomerAction } from "../../app/admin/customers/actions";
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

type CustomerFormValue = {
  assignedCoachId: string | null;
  customerCode: string;
  firstName: string | null;
  fullName: string;
  id: string;
  lastName: string | null;
  phone: string | null;
  status: CustomerStatus;
};

export function CustomerForm({
  coaches,
  customer,
}: {
  coaches: CoachOption[];
  customer?: CustomerFormValue;
}) {
  return (
    <form action={saveCustomerAction}>
      {customer ? <input name="id" type="hidden" value={customer.id} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <fieldset className="rounded-xl border border-border p-5">
          <legend className="px-2 text-sm font-bold uppercase tracking-wide text-brand">
            Customer identity
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Member code
              <input
                className={inputClass}
                defaultValue={customer?.customerCode ?? ""}
                maxLength={100}
                name="customerCode"
                placeholder="0012"
                required
              />
            </label>
            <label className={labelClass}>
              Full name
              <input
                className={inputClass}
                defaultValue={customer?.fullName ?? ""}
                maxLength={240}
                name="fullName"
                required
              />
            </label>
            <label className={labelClass}>
              First name
              <input
                className={inputClass}
                defaultValue={customer?.firstName ?? ""}
                maxLength={120}
                name="firstName"
              />
            </label>
            <label className={labelClass}>
              Last name
              <input
                className={inputClass}
                defaultValue={customer?.lastName ?? ""}
                maxLength={120}
                name="lastName"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-border p-5">
          <legend className="px-2 text-sm font-bold uppercase tracking-wide text-brand">
            Contact, status, and coach
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Phone
              <input
                className={inputClass}
                defaultValue={customer?.phone ?? ""}
                maxLength={120}
                name="phone"
              />
            </label>
            <label className={labelClass}>
              Customer status
              <select
                className={inputClass}
                defaultValue={customer?.status ?? CustomerStatus.ACTIVE}
                name="status"
                required
              >
                {Object.values(CustomerStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Assigned coach
              <select
                className={inputClass}
                defaultValue={customer?.assignedCoachId ?? ""}
                name="assignedCoachId"
              >
                <option value="">No assigned coach</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.firstName} {coach.lastName}
                    {coach.isActive ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>
      </div>

      <Button className="mt-5" type="submit">
        {customer ? "Save customer changes" : "Create customer"}
      </Button>
    </form>
  );
}
