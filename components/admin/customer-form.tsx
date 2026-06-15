"use client";

import { CustomerStatus } from "@prisma/client";
import { useActionState } from "react";

import {
  createCustomerAction,
  type CustomerCreateState,
  saveCustomerAction,
} from "../../app/admin/customers/actions";
import { Button } from "../ui/button";

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";
const initialCreateState: CustomerCreateState = {
  submissionId: 0,
  values: {
    birthDate: "",
    customerCode: "",
    emergencyPhone: "",
    firstName: "",
    fullName: "",
    lastName: "",
    phone: "",
    status: CustomerStatus.ACTIVE,
  },
};

type CoachOption = {
  firstName: string;
  id: string;
  isActive: boolean;
  lastName: string;
};

type CustomerFormValue = {
  assignedCoachId: string | null;
  birthDate: Date | null;
  customerCode: string;
  emergencyPhone: string | null;
  firstName: string | null;
  fullName: string;
  id: string;
  lastName: string | null;
  phone: string | null;
  status: CustomerStatus;
};

function inputDate(value: Date | null | undefined) {
  return value?.toISOString().slice(0, 10) ?? "";
}

export function CustomerForm({
  coaches,
  customer,
  returnToDetail = false,
}: {
  coaches: CoachOption[];
  customer?: CustomerFormValue;
  returnToDetail?: boolean;
}) {
  const [createState, createFormAction, isCreating] = useActionState(
    createCustomerAction,
    initialCreateState,
  );
  const isEditing = Boolean(customer);
  const createValues = createState.values;

  return (
    <form action={isEditing ? saveCustomerAction : createFormAction}>
      {customer ? <input name="id" type="hidden" value={customer.id} /> : null}
      {returnToDetail ? (
        <input name="returnToDetail" type="hidden" value="1" />
      ) : null}

      {createState.formError && !isEditing ? (
        <p
          className="mb-5 rounded-xl border border-status-high bg-page px-4 py-3 text-sm font-semibold text-foreground"
          role="alert"
        >
          {createState.formError}
        </p>
      ) : null}

      <div
        className="grid gap-6 xl:grid-cols-2"
        key={isEditing ? customer?.id : createState.submissionId}
      >
        <fieldset className="rounded-xl border border-border p-5">
          <legend className="px-2 text-sm font-bold uppercase tracking-wide text-brand">
            Customer identity
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Member code
              <input
                aria-describedby={
                  createState.fieldErrors?.customerCode && !isEditing
                    ? "create-customer-code-error"
                    : undefined
                }
                aria-invalid={
                  createState.fieldErrors?.customerCode && !isEditing
                    ? true
                    : undefined
                }
                className={inputClass}
                defaultValue={
                  customer?.customerCode ?? createValues.customerCode
                }
                maxLength={100}
                name="customerCode"
                placeholder="0012"
                required
              />
              {createState.fieldErrors?.customerCode && !isEditing ? (
                <span
                  className="mt-2 block text-sm font-semibold text-button-danger"
                  id="create-customer-code-error"
                  role="alert"
                >
                  {createState.fieldErrors.customerCode}
                </span>
              ) : null}
            </label>
            <label className={labelClass}>
              Full name
              <input
                aria-describedby={
                  createState.fieldErrors?.fullName && !isEditing
                    ? "create-full-name-error"
                    : undefined
                }
                aria-invalid={
                  createState.fieldErrors?.fullName && !isEditing
                    ? true
                    : undefined
                }
                className={inputClass}
                defaultValue={customer?.fullName ?? createValues.fullName}
                maxLength={240}
                name="fullName"
                required
              />
              {createState.fieldErrors?.fullName && !isEditing ? (
                <span
                  className="mt-2 block text-sm font-semibold text-button-danger"
                  id="create-full-name-error"
                  role="alert"
                >
                  {createState.fieldErrors.fullName}
                </span>
              ) : null}
            </label>
            <label className={labelClass}>
              Birth date
              <input
                aria-describedby={
                  createState.fieldErrors?.birthDate && !isEditing
                    ? "create-birth-date-error"
                    : undefined
                }
                aria-invalid={
                  createState.fieldErrors?.birthDate && !isEditing
                    ? true
                    : undefined
                }
                className={inputClass}
                defaultValue={
                  customer
                    ? inputDate(customer.birthDate)
                    : createValues.birthDate
                }
                max={new Date().toISOString().slice(0, 10)}
                name="birthDate"
                required
                type="date"
              />
              {createState.fieldErrors?.birthDate && !isEditing ? (
                <span
                  className="mt-2 block text-sm font-semibold text-button-danger"
                  id="create-birth-date-error"
                  role="alert"
                >
                  {createState.fieldErrors.birthDate}
                </span>
              ) : null}
            </label>
            <label className={labelClass}>
              First name
              <input
                className={inputClass}
                defaultValue={customer?.firstName ?? createValues.firstName}
                maxLength={120}
                name="firstName"
              />
            </label>
            <label className={labelClass}>
              Last name
              <input
                className={inputClass}
                defaultValue={customer?.lastName ?? createValues.lastName}
                maxLength={120}
                name="lastName"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-border p-5">
          <legend className="px-2 text-sm font-bold uppercase tracking-wide text-brand">
            {isEditing ? "Contact, status, and coach" : "Contact and status"}
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Phone
              <input
                className={inputClass}
                defaultValue={customer?.phone ?? createValues.phone}
                maxLength={120}
                name="phone"
              />
            </label>
            <label className={labelClass}>
              Emergency phone
              <input
                className={inputClass}
                defaultValue={
                  customer?.emergencyPhone ?? createValues.emergencyPhone
                }
                maxLength={120}
                name="emergencyPhone"
                type="tel"
              />
            </label>
            <label className={labelClass}>
              Customer status
              <select
                aria-describedby={
                  createState.fieldErrors?.status && !isEditing
                    ? "create-status-error"
                    : undefined
                }
                aria-invalid={
                  createState.fieldErrors?.status && !isEditing
                    ? true
                    : undefined
                }
                className={inputClass}
                defaultValue={
                  customer?.status ??
                  createValues.status ??
                  CustomerStatus.ACTIVE
                }
                name="status"
                required
              >
                {Object.values(CustomerStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.toLowerCase()}
                  </option>
                ))}
              </select>
              {createState.fieldErrors?.status && !isEditing ? (
                <span
                  className="mt-2 block text-sm font-semibold text-button-danger"
                  id="create-status-error"
                  role="alert"
                >
                  {createState.fieldErrors.status}
                </span>
              ) : null}
            </label>
            {customer ? (
              <label className={`${labelClass} sm:col-span-2`}>
                Assigned coach
                <select
                  className={inputClass}
                  defaultValue={customer.assignedCoachId ?? ""}
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
            ) : null}
          </div>
        </fieldset>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={!isEditing && isCreating} type="submit">
          {customer ? "Save customer changes" : "Create customer"}
        </Button>
        <Button type="reset" variant="neutral">
          Cancel changes
        </Button>
      </div>
    </form>
  );
}
