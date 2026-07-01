"use server";

import {
  CustomerPackageStatus,
  CustomerStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffRole } from "../../../lib/auth";
import {
  membershipDisplayName,
  serviceLineDisplayName,
} from "../../../lib/customer-memberships";
import { db } from "../../../lib/db";
import { writeAuditLog } from "../../../lib/logging";
import {
  calculateActualFrozenDays,
  calculateAdjustedExpiration,
  calculateFreezeUsage,
  calculatePlannedFreezeEndDate,
  MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE,
  validateFreezeDays,
  validateFreezePolicy,
} from "../../../lib/package-freezes";

const CUSTOMERS_PATH = "/admin/customers";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const customerStatuses = new Set(Object.values(CustomerStatus));
const packageStatuses = new Set(Object.values(CustomerPackageStatus));

type CustomerCreateField =
  | "birthDate"
  | "customerCode"
  | "email"
  | "fullName"
  | "status";

export type CustomerCreateValues = {
  address: string;
  birthDate: string;
  customerCode: string;
  email: string;
  emergencyPhone: string;
  firstName: string;
  fullName: string;
  lastName: string;
  phone: string;
  status: string;
};

export type CustomerCreateState = {
  fieldErrors?: Partial<Record<CustomerCreateField, string>>;
  formError?: string;
  submissionId: number;
  values: CustomerCreateValues;
};

class AssignedPackageEditError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

class AdvancedFreezeError extends Error {
  code: string;
  freezeDaysLeft?: number;

  constructor(code: string, freezeDaysLeft?: number) {
    super(code);
    this.code = code;
    this.freezeDaysLeft = freezeDaysLeft;
  }
}

class CustomerArchiveError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

function optionalText(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return null;
  }

  return value.trim().slice(0, maxLength) || null;
}

function optionalEmail(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return { ok: true as const, value: null };
  }

  const rawEmail = value.trim();

  if (!rawEmail) {
    return { ok: true as const, value: null };
  }

  if (rawEmail.length > 254) {
    return { ok: false as const, value: null };
  }

  const email = rawEmail.toLowerCase();

  return EMAIL_PATTERN.test(email)
    ? { ok: true as const, value: email }
    : { ok: false as const, value: null };
}

function nonNegativeInteger(formData: FormData, name: string) {
  const rawValue = optionalText(formData, name, 20);
  const value = rawValue === null ? Number.NaN : Number(rawValue);

  return Number.isInteger(value) && value >= 0 ? value : null;
}

function positiveInteger(formData: FormData, name: string) {
  const rawValue = optionalText(formData, name, 20);
  const value = rawValue === null ? Number.NaN : Number(rawValue);

  return Number.isInteger(value) && value > 0 ? value : null;
}

function optionalNonNegativeInteger(formData: FormData, name: string) {
  const rawValue = optionalText(formData, name, 20);

  if (rawValue === null) {
    return undefined;
  }

  const value = Number(rawValue);
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function accessLimit(formData: FormData, unlimitedName: string, limitName: string) {
  const unlimited = formData.get(unlimitedName) === "on";

  if (unlimited) {
    return { limit: null, ok: true as const, unlimited };
  }

  const limit = positiveInteger(formData, limitName);

  return limit === null
    ? { limit: null, ok: false as const, unlimited }
    : { limit, ok: true as const, unlimited };
}

function timeMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function optionalTime(formData: FormData, name: string) {
  const value = optionalText(formData, name, 5);

  if (!value) {
    return { ok: true as const, value: null };
  }

  return TIME_PATTERN.test(value)
    ? { ok: true as const, value }
    : { ok: false as const, value: null };
}

function timeRuleFromForm(formData: FormData) {
  const hasTimeRestriction = formData.get("hasTimeRestriction") === "on";

  if (!hasTimeRestriction) {
    return {
      allowedEndTime: null,
      allowedStartTime: null,
      hasTimeRestriction,
      ok: true as const,
      timeRestrictionLabel: null,
    };
  }

  const startTime = optionalTime(formData, "allowedStartTime");
  const endTime = optionalTime(formData, "allowedEndTime");

  if (!startTime.ok || !endTime.ok || !endTime.value) {
    return { ok: false as const };
  }

  const startMinutes = startTime.value ? timeMinutes(startTime.value) : 0;
  const endMinutes = timeMinutes(endTime.value);

  if (startMinutes >= endMinutes) {
    return { ok: false as const };
  }

  return {
    allowedEndTime: endTime.value,
    allowedStartTime: startTime.value,
    hasTimeRestriction,
    ok: true as const,
    timeRestrictionLabel: optionalText(formData, "timeRestrictionLabel", 200),
  };
}

function requiredDate(formData: FormData, name: string) {
  const value = optionalText(formData, name, 10);

  if (!value || !DATE_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

function draftText(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function customerCreateValues(formData: FormData): CustomerCreateValues {
  return {
    address: draftText(formData, "address", 500),
    birthDate: draftText(formData, "birthDate", 10),
    customerCode: draftText(formData, "customerCode", 100),
    email: draftText(formData, "email", 254),
    emergencyPhone: draftText(formData, "emergencyPhone", 120),
    firstName: draftText(formData, "firstName", 120),
    fullName: draftText(formData, "fullName", 240),
    lastName: draftText(formData, "lastName", 120),
    phone: draftText(formData, "phone", 120),
    status: draftText(formData, "status", 30),
  };
}

function createErrorState(
  previousState: CustomerCreateState,
  values: CustomerCreateValues,
  options: {
    fieldErrors?: CustomerCreateState["fieldErrors"];
    formError?: string;
  },
): CustomerCreateState {
  return {
    ...options,
    submissionId: previousState.submissionId + 1,
    values,
  };
}

async function coachExists(coachId: string | null) {
  if (!coachId) {
    return true;
  }

  return Boolean(
    await db.coach.findFirst({
      select: { id: true },
      where: { deletedAt: null, id: coachId },
    }),
  );
}

async function activeMembershipCount(
  transaction: Prisma.TransactionClient,
  customerId: string,
) {
  return transaction.customerPackage.count({
    where: {
      customerId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });
}

async function recalculateMembershipSessionTotals(
  transaction: Prisma.TransactionClient,
  customerPackageId: string,
) {
  const totals = await transaction.customerPackageService.aggregate({
    _sum: {
      initialSessions: true,
      remainingSessions: true,
    },
    where: {
      customerPackageId,
      deletedAt: null,
      isActive: true,
    },
  });

  return transaction.customerPackage.update({
    data: {
      initialSessions: totals._sum.initialSessions ?? 0,
      remainingSessions: totals._sum.remainingSessions ?? 0,
    },
    where: { id: customerPackageId },
  });
}

function revalidateCustomerPages() {
  revalidatePath("/admin");
  revalidatePath(CUSTOMERS_PATH);
}

function customerListPath(
  errorOrStatus: string,
  isError = true,
  view?: "archived",
) {
  const params = new URLSearchParams({
    [isError ? "error" : "status"]: errorOrStatus,
  });

  if (view) {
    params.set("view", view);
  }

  return `${CUSTOMERS_PATH}?${params.toString()}`;
}

function revalidateCustomerArchivePages(customerId?: string) {
  revalidateCustomerPages();
  if (customerId) {
    revalidatePath(`${CUSTOMERS_PATH}/${encodeURIComponent(customerId)}`);
  }
  revalidatePath("/admin/logs");
  revalidatePath("/registration");
  revalidatePath("/registration/general");
  revalidatePath("/registration/in-gym");
}

function startOfTodayUtc() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function activeStatusForExpiration(expirationDate: Date) {
  return expirationDate < startOfTodayUtc() ? "EXPIRED" : "ACTIVE";
}

function dateIsBeforeUtcDay(value: Date, boundary: Date) {
  return value.getTime() < boundary.getTime();
}

function isMembershipFreeze(freeze: {
  customerPackageServiceId?: string | null;
}) {
  return !freeze.customerPackageServiceId;
}

function serviceFreezeDateError({
  actualEndDate,
  retroactive,
  serviceEndDate,
  serviceStartDate,
  startDate,
}: {
  actualEndDate?: Date;
  retroactive: boolean;
  serviceEndDate: Date | null;
  serviceStartDate: Date | null;
  startDate: Date;
}) {
  if (!serviceStartDate || !serviceEndDate) {
    return "service-freeze-dates-required";
  }

  if (startDate < serviceStartDate) {
    return "service-freeze-before-start";
  }

  if (startDate > serviceEndDate) {
    return "service-freeze-after-end";
  }

  if (!retroactive && serviceEndDate < startOfTodayUtc()) {
    return "service-freeze-expired";
  }

  if (retroactive && actualEndDate && actualEndDate > new Date()) {
    return "invalid-retroactive-freeze";
  }

  return null;
}

function appendFreezeNote(existingNote: string | null, label: string, note: string | null) {
  if (!note) {
    return undefined;
  }

  return [existingNote, `${label}: ${note}`].filter(Boolean).join("\n\n");
}

function freezeErrorCode(error: unknown, fallback: string) {
  if (error instanceof AdvancedFreezeError) {
    return error.code;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "package-active-freeze";
  }

  return fallback;
}

function freezeErrorQuery(error: unknown, fallback: string) {
  const params = new URLSearchParams({
    error: freezeErrorCode(error, fallback),
  });

  if (
    error instanceof AdvancedFreezeError &&
    typeof error.freezeDaysLeft === "number"
  ) {
    params.set("freezeDaysLeft", error.freezeDaysLeft.toString());
  }

  return params.toString();
}

function revalidatePackageWorkflow(customerId: string) {
  revalidateCustomerPages();
  revalidatePath(`${CUSTOMERS_PATH}/${encodeURIComponent(customerId)}`);
  revalidatePath("/admin/logs");
  revalidatePath("/registration");
}

export async function createCustomerAction(
  previousState: CustomerCreateState,
  formData: FormData,
): Promise<CustomerCreateState> {
  const user = await requireStaffRole("ADMIN");
  const values = customerCreateValues(formData);
  const customerCode = optionalText(formData, "customerCode", 100);
  const fullName = optionalText(formData, "fullName", 240);
  const birthDate = requiredDate(formData, "birthDate");
  const email = optionalEmail(formData, "email");
  const rawStatus = optionalText(formData, "status", 30);
  const fieldErrors: CustomerCreateState["fieldErrors"] = {};

  if (!customerCode) {
    fieldErrors.customerCode = "Enter a member code.";
  }

  if (!fullName) {
    fieldErrors.fullName = "Enter the customer's full name.";
  }

  if (!birthDate) {
    fieldErrors.birthDate = "Enter a valid birth date.";
  }

  if (!email.ok) {
    fieldErrors.email = "Enter a valid email address or leave it empty.";
  }

  if (!rawStatus || !customerStatuses.has(rawStatus as CustomerStatus)) {
    fieldErrors.status = "Choose a valid customer status.";
  }

  if (
    !customerCode ||
    !fullName ||
    !birthDate ||
    !email.ok ||
    !rawStatus ||
    !customerStatuses.has(rawStatus as CustomerStatus)
  ) {
    return createErrorState(previousState, values, { fieldErrors });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (birthDate > today) {
    return createErrorState(previousState, values, {
      fieldErrors: {
        birthDate: "Birth date cannot be in the future.",
      },
    });
  }

  const duplicate = await db.customer.findFirst({
    select: { id: true },
    where: {
      customerCode,
      deletedAt: null,
    },
  });

  if (duplicate) {
    return createErrorState(previousState, values, {
      fieldErrors: {
        customerCode:
          "That member code is already assigned to another customer.",
      },
    });
  }

  let savedCustomerId: string;

  try {
    savedCustomerId = await db.$transaction(async (transaction) => {
      const saved = await transaction.customer.create({
        data: {
          assignedCoachId: null,
          address: optionalText(formData, "address", 500),
          birthDate,
          customerCode,
          email: email.value,
          emergencyPhone: optionalText(formData, "emergencyPhone", 120),
          firstName: optionalText(formData, "firstName", 120),
          fullName,
          gymPresenceStatus: "NOT_IN_GYM",
          lastName: optionalText(formData, "lastName", 120),
          phone: optionalText(formData, "phone", 120),
          status: rawStatus as CustomerStatus,
        },
      });

      await writeAuditLog(transaction, {
        actionType: "CUSTOMER_EDIT",
        actorId: user.id,
        customerId: saved.id,
        description: `Created customer ${saved.customerCode}: ${saved.fullName}.`,
        newValue: saved,
        targetId: saved.id,
        targetType: "Customer",
      });

      return saved.id;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return createErrorState(previousState, values, {
        fieldErrors: {
          customerCode:
            "That member code is already assigned to another customer.",
        },
      });
    }

    return createErrorState(previousState, values, {
      formError: "The customer could not be saved. Please try again.",
    });
  }

  revalidateCustomerPages();
  redirect(`${CUSTOMERS_PATH}/${encodeURIComponent(savedCustomerId)}`);
}

function customerActionPath(
  formData: FormData,
  customerId: string | null,
  suffix: string,
) {
  return formData.get("returnToDetail") === "1" && customerId
    ? `${CUSTOMERS_PATH}/${encodeURIComponent(customerId)}?${suffix}`
    : `${CUSTOMERS_PATH}?${suffix}`;
}

export async function saveCustomerAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const fullName = optionalText(formData, "fullName", 240);
  const birthDate = requiredDate(formData, "birthDate");
  const email = optionalEmail(formData, "email");
  const rawStatus = optionalText(formData, "status", 30);
  const assignedCoachId = optionalText(formData, "assignedCoachId", 100);

  if (
    !customerCode ||
    !fullName ||
    !birthDate ||
    !rawStatus ||
    !customerStatuses.has(rawStatus as CustomerStatus)
  ) {
    redirect(customerActionPath(formData, id, "error=invalid-customer"));
  }

  if (!email.ok) {
    redirect(customerActionPath(formData, id, "error=invalid-email"));
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (birthDate > today) {
    redirect(customerActionPath(formData, id, "error=invalid-birth-date"));
  }

  if (!(await coachExists(assignedCoachId))) {
    redirect(customerActionPath(formData, id, "error=invalid-coach"));
  }

  const duplicate = await db.customer.findFirst({
    select: { id: true },
    where: {
      customerCode,
      deletedAt: null,
      ...(id ? { id: { not: id } } : {}),
    },
  });

  if (duplicate) {
    redirect(customerActionPath(formData, id, "error=duplicate-code"));
  }

  const data = {
    assignedCoachId,
    address: optionalText(formData, "address", 500),
    birthDate,
    customerCode,
    email: email.value,
    emergencyPhone: optionalText(formData, "emergencyPhone", 120),
    firstName: optionalText(formData, "firstName", 120),
    fullName,
    lastName: optionalText(formData, "lastName", 120),
    phone: optionalText(formData, "phone", 120),
    status: rawStatus as CustomerStatus,
  };

  let savedCustomerId: string;

  try {
    savedCustomerId = await db.$transaction(async (transaction) => {
      if (id) {
        const existing = await transaction.customer.findFirst({
          where: { deletedAt: null, id },
        });

        if (!existing) {
          throw new Error("Customer not found.");
        }

        const saved = await transaction.customer.update({
          data,
          where: { id },
        });

        await writeAuditLog(transaction, {
          actionType: "CUSTOMER_EDIT",
          actorId: user.id,
          customerId: saved.id,
          description: `Updated customer ${saved.customerCode}: ${saved.fullName}.`,
          newValue: saved,
          oldValue: existing,
          targetId: saved.id,
          targetType: "Customer",
        });
        return saved.id;
      }

      const saved = await transaction.customer.create({
        data: {
          ...data,
          gymPresenceStatus: "NOT_IN_GYM",
        },
      });

      await writeAuditLog(transaction, {
        actionType: "CUSTOMER_EDIT",
        actorId: user.id,
        customerId: saved.id,
        description: `Created customer ${saved.customerCode}: ${saved.fullName}.`,
        newValue: saved,
        targetId: saved.id,
        targetType: "Customer",
      });

      return saved.id;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect(customerActionPath(formData, id, "error=duplicate-code"));
    }

    redirect(customerActionPath(formData, id, "error=customer-unavailable"));
  }

  revalidateCustomerPages();
  revalidatePath(
    `${CUSTOMERS_PATH}/${encodeURIComponent(savedCustomerId)}`,
  );
  if (!id) {
    redirect(`${CUSTOMERS_PATH}/${encodeURIComponent(savedCustomerId)}`);
  }
  redirect(customerActionPath(formData, id, "status=customer-saved"));
}

export async function archiveCustomerAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);

  if (!customerId) {
    redirect(`${CUSTOMERS_PATH}?error=invalid-customer`);
  }

  try {
    await db.$transaction(async (transaction) => {
      const customer = await transaction.customer.findFirst({
        select: {
          customerCode: true,
          fullName: true,
          gymPresenceStatus: true,
          id: true,
          status: true,
          updatedAt: true,
        },
        where: { deletedAt: null, id: customerId },
      });

      if (!customer) {
        throw new CustomerArchiveError("customer-archive-unavailable");
      }

      if (customer.gymPresenceStatus === "IN_GYM") {
        throw new CustomerArchiveError("customer-archive-in-gym");
      }

      const openVisit = await transaction.gymVisit.findFirst({
        select: { id: true },
        where: {
          checkedOutAt: null,
          customerId: customer.id,
        },
      });

      if (openVisit) {
        throw new CustomerArchiveError("customer-archive-open-visit");
      }

      const deletedAt = new Date();
      const update = await transaction.customer.updateMany({
        data: {
          deletedAt,
          status: "INACTIVE",
        },
        where: {
          deletedAt: null,
          gymPresenceStatus: "NOT_IN_GYM",
          id: customer.id,
          updatedAt: customer.updatedAt,
        },
      });

      if (update.count !== 1) {
        throw new CustomerArchiveError("customer-archive-stale");
      }

      await writeAuditLog(transaction, {
        actionType: "CUSTOMER_EDIT",
        actorId: user.id,
        customerId: customer.id,
        description: `Archived customer profile ${customer.customerCode}: ${customer.fullName}. Operational history was preserved.`,
        newValue: {
          deletedAt,
          status: "INACTIVE",
        },
        oldValue: {
          deletedAt: null,
          gymPresenceStatus: customer.gymPresenceStatus,
          status: customer.status,
        },
        targetId: customer.id,
        targetType: "Customer",
      });
    });
  } catch (error) {
    const errorCode =
      error instanceof CustomerArchiveError
        ? error.code
        : "customer-archive-unavailable";

    redirect(
      `${CUSTOMERS_PATH}/${encodeURIComponent(customerId)}?error=${errorCode}`,
    );
  }

  revalidateCustomerArchivePages(customerId);
  redirect(`${CUSTOMERS_PATH}?status=customer-archived`);
}

export async function restoreCustomerAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);

  if (!customerId) {
    redirect(customerListPath("invalid-customer", true, "archived"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const customer = await transaction.customer.findFirst({
        select: {
          customerCode: true,
          deletedAt: true,
          fullName: true,
          id: true,
          status: true,
        },
        where: { deletedAt: { not: null }, id: customerId },
      });

      if (!customer) {
        throw new CustomerArchiveError("customer-restore-unavailable");
      }

      const saved = await transaction.customer.update({
        data: { deletedAt: null },
        where: { id: customer.id },
      });

      await writeAuditLog(transaction, {
        actionType: "CUSTOMER_EDIT",
        actorId: user.id,
        customerId: customer.id,
        description: `Restored customer profile ${customer.customerCode}: ${customer.fullName}.`,
        newValue: {
          deletedAt: null,
          status: saved.status,
        },
        oldValue: {
          deletedAt: customer.deletedAt,
          status: customer.status,
        },
        targetId: customer.id,
        targetType: "Customer",
      });
    });
  } catch (error) {
    const errorCode =
      error instanceof CustomerArchiveError
        ? error.code
        : "customer-restore-unavailable";

    redirect(customerListPath(errorCode, true, "archived"));
  }

  revalidateCustomerArchivePages(customerId);
  redirect(customerListPath("customer-restored", false));
}

export async function deleteCustomerAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);

  if (!customerId) {
    redirect(customerListPath("invalid-customer", true, "archived"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const customer = await transaction.customer.findFirst({
        where: { deletedAt: { not: null }, id: customerId },
      });

      if (!customer) {
        throw new CustomerArchiveError("customer-delete-unavailable");
      }

      const relationCounts = await Promise.all([
        transaction.customerPackage.count({ where: { customerId } }),
        transaction.gymVisit.count({ where: { customerId } }),
        transaction.note.count({ where: { customerId } }),
        transaction.customerDocument.count({ where: { customerId } }),
        transaction.packageSessionChange.count({
          where: { customerPackage: { customerId } },
        }),
        transaction.visitPackageUsage.count({
          where: {
            OR: [
              { customerPackage: { customerId } },
              { visit: { customerId } },
            ],
          },
        }),
        transaction.customerPackageService.count({
          where: { customerPackage: { customerId } },
        }),
        transaction.packageFreeze.count({
          where: { customerPackage: { customerId } },
        }),
        transaction.occupancyEvent.count({
          where: { visit: { customerId } },
        }),
        transaction.auditLog.count({
          where: {
            OR: [
              { customerId },
              { targetId: customerId, targetType: "Customer" },
            ],
          },
        }),
      ]);

      if (relationCounts.some((count) => count > 0)) {
        throw new CustomerArchiveError("customer-delete-blocked");
      }

      await transaction.customer.delete({ where: { id: customer.id } });
      await writeAuditLog(transaction, {
        actionType: "CUSTOMER_EDIT",
        actorId: user.id,
        description: `Permanently deleted archived customer profile ${customer.customerCode}: ${customer.fullName}.`,
        oldValue: customer,
        targetId: customer.id,
        targetType: "Customer",
      });
    });
  } catch (error) {
    const errorCode =
      error instanceof CustomerArchiveError
        ? error.code
        : "customer-delete-unavailable";

    redirect(customerListPath(errorCode, true, "archived"));
  }

  revalidateCustomerArchivePages(customerId);
  redirect(customerListPath("customer-deleted", false, "archived"));
}

export async function assignCustomerPackageAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const packageId = optionalText(formData, "packageId", 100);
  const coachId = optionalText(formData, "coachId", 100);
  const activationDate = requiredDate(formData, "activationDate");
  const expirationDate = requiredDate(formData, "expirationDate");
  const initialSessions = nonNegativeInteger(formData, "initialSessions");
  const remainingSessions = nonNegativeInteger(formData, "remainingSessions");
  const initialGuestPassesInput = optionalNonNegativeInteger(
    formData,
    "initialGuestPasses",
  );
  const remainingGuestPassesInput = optionalNonNegativeInteger(
    formData,
    "remainingGuestPasses",
  );
  const rawStatus = optionalText(formData, "status", 30);

  if (
    !customerId ||
    !packageId ||
    !activationDate ||
    !expirationDate ||
    initialSessions === null ||
    remainingSessions === null ||
    initialGuestPassesInput === null ||
    remainingGuestPassesInput === null ||
    !rawStatus ||
    !packageStatuses.has(rawStatus as CustomerPackageStatus)
  ) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-assignment"),
    );
  }

  if (expirationDate < activationDate) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-date-order"),
    );
  }

  if (!(await coachExists(coachId))) {
    redirect(customerActionPath(formData, customerId, "error=invalid-coach"));
  }

  const [customer, gymPackage] = await Promise.all([
    db.customer.findFirst({
      select: { customerCode: true, fullName: true, id: true },
      where: { deletedAt: null, id: customerId },
    }),
    db.package.findFirst({
      select: {
        allowedEndTime: true,
        allowedStartTime: true,
        defaultFreezeChances: true,
        defaultGuestPasses: true,
        hasTimeRestriction: true,
        id: true,
        name: true,
        timeRestrictionLabel: true,
      },
      where: { deletedAt: null, id: packageId, isActive: true },
    }),
  ]);

  if (!customer) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-customer"),
    );
  }

  if (!gymPackage) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-package"),
    );
  }

  const initialGuestPasses =
    initialGuestPassesInput ?? gymPackage.defaultGuestPasses;
  const remainingGuestPasses =
    remainingGuestPassesInput ?? gymPackage.defaultGuestPasses;

  try {
    await db.$transaction(async (transaction) => {
      const saved = await transaction.customerPackage.create({
        data: {
          activationDate,
          allowedEndTime: gymPackage.allowedEndTime,
          allowedStartTime: gymPackage.allowedStartTime,
          coachId,
          customerId,
          expirationDate,
          hasTimeRestriction: gymPackage.hasTimeRestriction,
          initialGuestPasses,
          initialSessions,
          packageId,
          remainingGuestPasses,
          remainingFreezeChances: Math.min(
            gymPackage.defaultFreezeChances,
            MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE,
          ),
          remainingSessions,
          status: rawStatus as CustomerPackageStatus,
          timeRestrictionLabel: gymPackage.timeRestrictionLabel,
        },
      });

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_RENEWAL",
        actorId: user.id,
        customerId,
        description: `Assigned ${gymPackage.name} to ${customer.customerCode}: ${customer.fullName}.`,
        newValue: saved,
        targetId: saved.id,
        targetType: "CustomerPackage",
      });
    });
  } catch {
    redirect(
      customerActionPath(formData, customerId, "error=assignment-unavailable"),
    );
  }

  revalidateCustomerPages();
  revalidatePath(`${CUSTOMERS_PATH}/${encodeURIComponent(customerId)}`);
  redirect(
    customerActionPath(formData, customerId, "status=package-assigned"),
  );
}

export async function editCustomerPackageAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const packageId = optionalText(formData, "packageId", 100);
  const coachId = optionalText(formData, "coachId", 100);
  const activationDate = requiredDate(formData, "activationDate");
  const expirationDate = requiredDate(formData, "expirationDate");
  const initialSessions = nonNegativeInteger(formData, "initialSessions");
  const remainingSessions = nonNegativeInteger(formData, "remainingSessions");
  const initialGuestPasses = nonNegativeInteger(
    formData,
    "initialGuestPasses",
  );
  const remainingGuestPasses = nonNegativeInteger(
    formData,
    "remainingGuestPasses",
  );
  const remainingFreezeChances = nonNegativeInteger(
    formData,
    "remainingFreezeChances",
  );
  const rawStatus = optionalText(formData, "status", 30);

  if (
    !customerId ||
    !customerPackageId ||
    !packageId ||
    !activationDate ||
    !expirationDate ||
    initialSessions === null ||
    remainingSessions === null ||
    initialGuestPasses === null ||
    remainingGuestPasses === null ||
    remainingFreezeChances === null ||
    !rawStatus ||
    !packageStatuses.has(rawStatus as CustomerPackageStatus)
  ) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-package-edit"),
    );
  }

  if (expirationDate < activationDate) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-date-order"),
    );
  }

  if (
    remainingSessions > initialSessions ||
    remainingGuestPasses > initialGuestPasses
  ) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-package-balance"),
    );
  }

  if (!(await coachExists(coachId))) {
    redirect(customerActionPath(formData, customerId, "error=invalid-coach"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const [existing, gymPackage, openVisitUsage] = await Promise.all([
        transaction.customerPackage.findFirst({
          include: {
            coach: {
              select: { firstName: true, lastName: true },
            },
            customer: {
              select: { customerCode: true, fullName: true, id: true },
            },
            freezes: {
              select: {
                actualDays: true,
                plannedDays: true,
                status: true,
              },
            },
            package: {
              select: { id: true, name: true },
            },
          },
          where: {
            customerId,
            deletedAt: null,
            id: customerPackageId,
          },
        }),
        transaction.package.findFirst({
          select: {
            allowedEndTime: true,
            allowedStartTime: true,
            hasTimeRestriction: true,
            id: true,
            isActive: true,
            name: true,
            timeRestrictionLabel: true,
          },
          where: { deletedAt: null, id: packageId },
        }),
        transaction.visitPackageUsage.findFirst({
          select: { id: true },
          where: {
            customerPackageId,
            visit: { checkedOutAt: null },
          },
        }),
      ]);

      if (!existing?.customer || !gymPackage) {
        throw new AssignedPackageEditError("package-edit-unavailable");
      }

      if (existing.packageId !== gymPackage.id && !gymPackage.isActive) {
        throw new AssignedPackageEditError("invalid-package");
      }

      if (openVisitUsage) {
        throw new AssignedPackageEditError("package-edit-open-visit");
      }

      const nextStatus = rawStatus as CustomerPackageStatus;

      if (
        (existing.status === "FROZEN" && nextStatus !== "FROZEN") ||
        (existing.status !== "FROZEN" && nextStatus === "FROZEN")
      ) {
        throw new AssignedPackageEditError("package-edit-frozen-status");
      }

      const freezeUsage = calculateFreezeUsage(existing.freezes);
      if (remainingFreezeChances > freezeUsage.remainingFreezeCount) {
        throw new AssignedPackageEditError("package-edit-freeze-counter");
      }

      const nextCoach = coachId
        ? await transaction.coach.findFirst({
            select: { firstName: true, id: true, lastName: true },
            where: { deletedAt: null, id: coachId },
          })
        : null;

      if (coachId && !nextCoach) {
        throw new AssignedPackageEditError("invalid-coach");
      }

      const update = await transaction.customerPackage.updateMany({
        data: {
          activationDate,
          allowedEndTime:
            existing.packageId === gymPackage.id
              ? existing.allowedEndTime
              : gymPackage.allowedEndTime,
          allowedStartTime:
            existing.packageId === gymPackage.id
              ? existing.allowedStartTime
              : gymPackage.allowedStartTime,
          coachId,
          expirationDate,
          hasTimeRestriction:
            existing.packageId === gymPackage.id
              ? existing.hasTimeRestriction
              : gymPackage.hasTimeRestriction,
          initialGuestPasses,
          initialSessions,
          packageId,
          remainingGuestPasses,
          remainingFreezeChances,
          remainingSessions,
          status: nextStatus,
          timeRestrictionLabel:
            existing.packageId === gymPackage.id
              ? existing.timeRestrictionLabel
              : gymPackage.timeRestrictionLabel,
        },
        where: {
          customerId,
          deletedAt: null,
          id: existing.id,
          updatedAt: existing.updatedAt,
        },
      });

      if (update.count !== 1) {
        throw new AssignedPackageEditError("package-edit-stale");
      }

      const saved = await transaction.customerPackage.findUniqueOrThrow({
        where: { id: existing.id },
      });
      const coachName = (coach: {
        firstName: string;
        lastName: string;
      } | null) =>
        coach ? `${coach.firstName} ${coach.lastName}` : null;

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_EDIT",
        actorId: user.id,
        customerId: existing.customer.id,
        description: `Updated assigned package ${membershipDisplayName(existing)} for ${existing.customer.customerCode}: ${existing.customer.fullName}.`,
        newValue: {
          allowedEndTime: saved.allowedEndTime,
          allowedStartTime: saved.allowedStartTime,
          activationDate: saved.activationDate,
          coachId: saved.coachId,
          coachName: coachName(nextCoach),
          expirationDate: saved.expirationDate,
          hasTimeRestriction: saved.hasTimeRestriction,
          initialGuestPasses: saved.initialGuestPasses,
          initialSessions: saved.initialSessions,
          packageId: saved.packageId,
          packageName: gymPackage.name,
          remainingGuestPasses: saved.remainingGuestPasses,
          remainingFreezeChances: saved.remainingFreezeChances,
          remainingSessions: saved.remainingSessions,
          status: saved.status,
          timeRestrictionLabel: saved.timeRestrictionLabel,
        },
        oldValue: {
          allowedEndTime: existing.allowedEndTime,
          allowedStartTime: existing.allowedStartTime,
          activationDate: existing.activationDate,
          coachId: existing.coachId,
          coachName: coachName(existing.coach),
          expirationDate: existing.expirationDate,
          hasTimeRestriction: existing.hasTimeRestriction,
          initialGuestPasses: existing.initialGuestPasses,
          initialSessions: existing.initialSessions,
          packageId: existing.packageId,
          packageName: existing.package?.name ?? null,
          remainingGuestPasses: existing.remainingGuestPasses,
          remainingFreezeChances: existing.remainingFreezeChances,
          remainingSessions: existing.remainingSessions,
          status: existing.status,
          timeRestrictionLabel: existing.timeRestrictionLabel,
        },
        targetId: saved.id,
        targetType: "CustomerPackage",
      });
    });
  } catch (error) {
    redirect(
      customerActionPath(
        formData,
        customerId,
        `error=${
          error instanceof AssignedPackageEditError
            ? error.code
            : "package-edit-unavailable"
        }`,
      ),
    );
  }

  revalidateCustomerPages();
  revalidatePath(`${CUSTOMERS_PATH}/${encodeURIComponent(customerId)}`);
  revalidatePath("/admin/logs");
  revalidatePath("/registration");
  redirect(
    customerActionPath(formData, customerId, "status=package-updated"),
  );
}

export async function saveCustomerMembershipAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const membershipName = optionalText(formData, "membershipName", 200);
  const membershipType = optionalText(formData, "membershipType", 150);
  const membershipCost = optionalText(formData, "membershipCost", 150);
  const activationDate = requiredDate(formData, "activationDate");
  const expirationDate = requiredDate(formData, "expirationDate");
  const initialGuestPasses = nonNegativeInteger(
    formData,
    "initialGuestPasses",
  );
  const remainingGuestPasses = nonNegativeInteger(
    formData,
    "remainingGuestPasses",
  );
  const remainingFreezeChances = nonNegativeInteger(
    formData,
    "remainingFreezeChances",
  );
  const rawStatus = optionalText(formData, "status", 30);
  const intervalLimit = accessLimit(
    formData,
    "hasUnlimitedIntervalCheckIns",
    "intervalCheckInLimit",
  );
  const dailyLimit = accessLimit(
    formData,
    "hasUnlimitedDailyCheckIns",
    "dailyCheckInLimit",
  );
  const timeRule = timeRuleFromForm(formData);

  if (
    !customerId ||
    !membershipName ||
    !activationDate ||
    !expirationDate ||
    initialGuestPasses === null ||
    remainingGuestPasses === null ||
    remainingFreezeChances === null ||
    !rawStatus ||
    !packageStatuses.has(rawStatus as CustomerPackageStatus) ||
    !timeRule.ok
  ) {
    redirect(customerActionPath(formData, customerId, "error=invalid-membership"));
  }

  if (expirationDate < activationDate) {
    redirect(customerActionPath(formData, customerId, "error=invalid-date-order"));
  }

  if (
    remainingGuestPasses > initialGuestPasses ||
    remainingFreezeChances > MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE
  ) {
    redirect(customerActionPath(formData, customerId, "error=invalid-membership-balance"));
  }

  if (!intervalLimit.ok || !dailyLimit.ok) {
    redirect(customerActionPath(formData, customerId, "error=invalid-access-limit"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const customer = await transaction.customer.findFirst({
        select: { customerCode: true, fullName: true, id: true },
        where: { deletedAt: null, id: customerId },
      });

      if (!customer) {
        throw new AssignedPackageEditError("invalid-customer");
      }

      const activeCount = await activeMembershipCount(transaction, customerId);
      if (activeCount > 1) {
        throw new AssignedPackageEditError("membership-conflict");
      }

      const data = {
        activationDate,
        allowedEndTime: timeRule.allowedEndTime,
        allowedStartTime: timeRule.allowedStartTime,
        expirationDate,
        hasTimeRestriction: timeRule.hasTimeRestriction,
        hasUnlimitedDailyCheckIns: dailyLimit.unlimited,
        hasUnlimitedIntervalCheckIns: intervalLimit.unlimited,
        initialGuestPasses,
        intervalCheckInLimit: intervalLimit.limit,
        dailyCheckInLimit: dailyLimit.limit,
        membershipCost,
        membershipName,
        membershipType,
        remainingFreezeChances,
        remainingGuestPasses,
        status: rawStatus as CustomerPackageStatus,
        timeRestrictionLabel: timeRule.timeRestrictionLabel,
      };

      if (customerPackageId) {
        const existing = await transaction.customerPackage.findFirst({
          include: {
            coach: {
              select: { firstName: true, lastName: true },
            },
            package: {
              select: { name: true },
            },
          },
          where: {
            customerId,
            deletedAt: null,
            id: customerPackageId,
          },
        });

        if (!existing) {
          throw new AssignedPackageEditError("invalid-membership");
        }

        if (
          rawStatus === "ACTIVE" &&
          (await transaction.customerPackage.count({
            where: {
              customerId,
              deletedAt: null,
              id: { not: customerPackageId },
              status: "ACTIVE",
            },
          })) > 0
        ) {
          throw new AssignedPackageEditError("membership-conflict");
        }

        const saved = await transaction.customerPackage.update({
          data,
          where: { id: customerPackageId },
        });

        await writeAuditLog(transaction, {
          actionType: "PACKAGE_EDIT",
          actorId: user.id,
          customerId,
          description: `Updated membership container for ${customer.customerCode}: ${customer.fullName}.`,
          newValue: saved,
          oldValue: existing,
          targetId: saved.id,
          targetType: "CustomerPackage",
        });
        return;
      }

      const currentContainer = await transaction.customerPackage.findFirst({
        select: { id: true },
        where: {
          customerId,
          deletedAt: null,
          status: { in: ["ACTIVE", "FROZEN"] },
        },
      });

      if (currentContainer) {
        throw new AssignedPackageEditError("membership-exists");
      }

      const saved = await transaction.customerPackage.create({
        data: {
          ...data,
          customerId,
          initialSessions: 0,
          packageId: null,
          remainingSessions: 0,
        },
      });

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_RENEWAL",
        actorId: user.id,
        customerId,
        description: `Created manual membership ${membershipDisplayName(saved)} for ${customer.customerCode}: ${customer.fullName}.`,
        newValue: saved,
        targetId: saved.id,
        targetType: "CustomerPackage",
      });
    });
  } catch (error) {
    redirect(
      customerActionPath(
        formData,
        customerId,
        `error=${
          error instanceof AssignedPackageEditError
            ? error.code
            : "membership-unavailable"
        }`,
      ),
    );
  }

  revalidatePackageWorkflow(customerId);
  redirect(customerActionPath(formData, customerId, "status=membership-saved"));
}

export async function saveCustomerPackageServiceAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const serviceId = optionalText(formData, "serviceId", 100);
  const serviceName = optionalText(formData, "serviceName", 200);
  const coachName = optionalText(formData, "serviceCoachName", 200);
  const startDate = requiredDate(formData, "serviceStartDate");
  const endDate = requiredDate(formData, "serviceEndDate");
  const initialSessions = nonNegativeInteger(formData, "serviceInitialSessions");
  const remainingSessions = nonNegativeInteger(
    formData,
    "serviceRemainingSessions",
  );
  const sortOrderInput = optionalNonNegativeInteger(formData, "sortOrder");
  const sortOrder = sortOrderInput === undefined ? 0 : sortOrderInput;
  const notes = optionalText(formData, "serviceNotes", 1000);
  const isActive = formData.get("isActive") === "on";

  if (
    !customerId ||
    !customerPackageId ||
    !serviceName ||
    !startDate ||
    !endDate ||
    initialSessions === null ||
    remainingSessions === null ||
    sortOrder === null
  ) {
    redirect(customerActionPath(formData, customerId, "error=invalid-service"));
  }

  if (remainingSessions > initialSessions) {
    redirect(customerActionPath(formData, customerId, "error=service-balance-invalid"));
  }

  if (endDate < startDate) {
    redirect(customerActionPath(formData, customerId, "error=invalid-service-dates"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const membership = await transaction.customerPackage.findFirst({
        include: {
          customer: {
            select: { customerCode: true, fullName: true, id: true },
          },
          package: {
            select: { name: true },
          },
        },
        where: {
          customerId,
          deletedAt: null,
          id: customerPackageId,
        },
      });

      if (!membership) {
        throw new AssignedPackageEditError("invalid-membership");
      }

      if ((await activeMembershipCount(transaction, customerId)) > 1) {
        throw new AssignedPackageEditError("membership-conflict");
      }

      if (
        startDate < membership.activationDate ||
        endDate > membership.expirationDate
      ) {
        throw new AssignedPackageEditError("service-date-outside-membership");
      }

      const data = {
        coachName,
        endDate,
        initialSessions,
        isActive,
        notes,
        remainingSessions,
        serviceName,
        sortOrder,
        startDate,
      };

      if (serviceId) {
        const existing = await transaction.customerPackageService.findFirst({
          where: {
            customerPackageId,
            deletedAt: null,
            id: serviceId,
          },
        });

        if (!existing) {
          throw new AssignedPackageEditError("invalid-service");
        }

        const saved = await transaction.customerPackageService.update({
          data,
          where: { id: serviceId },
        });
        await recalculateMembershipSessionTotals(
          transaction,
          customerPackageId,
        );

        await writeAuditLog(transaction, {
          actionType: "PACKAGE_EDIT",
          actorId: user.id,
          customerId,
          description: `Updated service line ${saved.serviceName} for ${membership.customer.customerCode}: ${membership.customer.fullName}.`,
          newValue: saved,
          oldValue: existing,
          targetId: saved.id,
          targetType: "CustomerPackageService",
        });
        return;
      }

      const saved = await transaction.customerPackageService.create({
        data: {
          ...data,
          customerPackageId,
        },
      });
      await recalculateMembershipSessionTotals(transaction, customerPackageId);

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_EDIT",
        actorId: user.id,
        customerId,
        description: `Added service line ${saved.serviceName} to ${membershipDisplayName(membership)} for ${membership.customer.customerCode}: ${membership.customer.fullName}.`,
        newValue: saved,
        targetId: saved.id,
        targetType: "CustomerPackageService",
      });
    });
  } catch (error) {
    redirect(
      customerActionPath(
        formData,
        customerId,
        `error=${
          error instanceof AssignedPackageEditError
            ? error.code
            : "service-unavailable"
        }`,
      ),
    );
  }

  revalidatePackageWorkflow(customerId);
  redirect(customerActionPath(formData, customerId, "status=service-saved"));
}

export async function deactivateCustomerPackageServiceAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const serviceId = optionalText(formData, "serviceId", 100);

  if (!customerId || !customerPackageId || !serviceId) {
    redirect(customerActionPath(formData, customerId, "error=invalid-service"));
  }

  try {
    await db.$transaction(async (transaction) => {
      if ((await activeMembershipCount(transaction, customerId)) > 1) {
        throw new AssignedPackageEditError("membership-conflict");
      }

      const existing = await transaction.customerPackageService.findFirst({
        include: {
          customerPackage: {
            select: {
              customer: {
                select: { customerCode: true, fullName: true },
              },
            },
          },
        },
        where: {
          customerPackageId,
          customerPackage: {
            customerId,
            deletedAt: null,
          },
          deletedAt: null,
          id: serviceId,
        },
      });

      if (!existing) {
        throw new AssignedPackageEditError("invalid-service");
      }

      const saved = await transaction.customerPackageService.update({
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
        where: { id: serviceId },
      });
      await recalculateMembershipSessionTotals(transaction, customerPackageId);

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_EDIT",
        actorId: user.id,
        customerId,
        description: `Deactivated service line ${existing.serviceName} for ${existing.customerPackage.customer.customerCode}: ${existing.customerPackage.customer.fullName}.`,
        newValue: saved,
        oldValue: existing,
        targetId: saved.id,
        targetType: "CustomerPackageService",
      });
    });
  } catch (error) {
    redirect(
      customerActionPath(
        formData,
        customerId,
        `error=${
          error instanceof AssignedPackageEditError
            ? error.code
            : "service-unavailable"
        }`,
      ),
    );
  }

  revalidatePackageWorkflow(customerId);
  redirect(customerActionPath(formData, customerId, "status=service-deactivated"));
}

export async function adminFreezeCustomerPackageAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const startDate = requiredDate(formData, "startDate");
  const plannedDays = positiveInteger(formData, "plannedDays");
  const notes = optionalText(formData, "notes", 1000);

  if (!customerId || !customerCode || !customerPackageId) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-package-action"),
    );
  }

  if (!startDate || startDate < startOfTodayUtc()) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-freeze-dates"),
    );
  }

  if (plannedDays === null || !validateFreezeDays(plannedDays)) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-freeze-days"),
    );
  }

  try {
    await db.$transaction(async (transaction) => {
      const customerPackage = await transaction.customerPackage.findFirst({
        include: {
          customer: {
            select: { customerCode: true, fullName: true, id: true },
          },
          freezes: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: {
              actualDays: true,
              customerPackageServiceId: true,
              id: true,
              plannedDays: true,
              status: true,
            },
          },
          package: {
            select: { deletedAt: true, isActive: true, name: true },
          },
        },
        where: {
          customer: { deletedAt: null },
          customerId,
          deletedAt: null,
          id: customerPackageId,
        },
      });

      if (
        !customerPackage ||
        customerPackage.customer.customerCode !== customerCode
      ) {
        throw new AdvancedFreezeError("invalid-package-action");
      }

      if (
        customerPackage.freezes.some(
          (freeze) => freeze.status === "ACTIVE" && isMembershipFreeze(freeze),
        )
      ) {
        throw new AdvancedFreezeError("package-active-freeze");
      }

      const today = startOfTodayUtc();
      if (
        customerPackage.status !== "ACTIVE" ||
        customerPackage.expirationDate < today ||
        customerPackage.remainingSessions <= 0 ||
        Boolean(
          customerPackage.package &&
            (customerPackage.package.deletedAt ||
              !customerPackage.package.isActive),
        )
      ) {
        throw new AdvancedFreezeError("package-not-freezable");
      }

      const freezePolicy = validateFreezePolicy({
        freezes: customerPackage.freezes,
        remainingFreezeChances: customerPackage.remainingFreezeChances,
        requestedDays: plannedDays,
      });

      if (!freezePolicy.ok) {
        throw new AdvancedFreezeError(
          freezePolicy.code,
          freezePolicy.usage.remainingFreezeDays,
        );
      }

      const plannedEndDate = calculatePlannedFreezeEndDate(
        startDate,
        plannedDays,
      );
      const resultingExpirationDate = calculateAdjustedExpiration(
        customerPackage.expirationDate,
        plannedDays,
      );
      const startsNow = !dateIsBeforeUtcDay(startOfTodayUtc(), startDate);
      const update = await transaction.customerPackage.updateMany({
        data: {
          expirationDate: resultingExpirationDate,
          reactivatedAt: null,
          remainingFreezeChances: { decrement: 1 },
          ...(startsNow
            ? {
                frozenAt: startDate,
                status: "FROZEN" as const,
              }
            : {}),
        },
        where: {
          customerId,
          deletedAt: null,
          id: customerPackage.id,
          remainingFreezeChances: { gt: 0 },
          status: "ACTIVE",
          updatedAt: customerPackage.updatedAt,
        },
      });

      if (update.count !== 1) {
        throw new AdvancedFreezeError("package-status-stale");
      }

      const freeze = await transaction.packageFreeze.create({
        data: {
          createdById: user.id,
          customerPackageId: customerPackage.id,
          mode: "NORMAL",
          notes,
          originalExpirationDate: customerPackage.expirationDate,
          plannedDays,
          plannedEndDate,
          resultingExpirationDate,
          startDate,
          status: "ACTIVE",
        },
      });

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_FREEZE",
        actorId: user.id,
        customerId: customerPackage.customer.id,
        description: `Advanced normal freeze for ${membershipDisplayName(customerPackage)} on ${customerPackage.customer.customerCode}: ${customerPackage.customer.fullName} for ${plannedDays} day${plannedDays === 1 ? "" : "s"}.`,
        newValue: {
          freezeId: freeze.id,
          freezeCountAfter: freezePolicy.usage.confirmedFreezeCount + 1,
          freezeCountBefore: freezePolicy.usage.confirmedFreezeCount,
          freezeDaysRemainingAfter: Math.max(
            0,
            freezePolicy.usage.remainingFreezeDays - plannedDays,
          ),
          freezeDaysUsedAfter:
            freezePolicy.usage.usedFreezeDays + plannedDays,
          freezeDaysUsedBefore: freezePolicy.usage.usedFreezeDays,
          freezeNumber: freezePolicy.freezeNumber,
          mode: freeze.mode,
          originalExpirationDate: customerPackage.expirationDate,
          paidFreezeNoticeRequired: freezePolicy.isPaid,
          plannedDays,
          plannedEndDate,
          remainingFreezeChances:
            customerPackage.remainingFreezeChances - 1,
          resultingExpirationDate,
          startDate,
          status: startsNow ? "FROZEN" : customerPackage.status,
        },
        oldValue: {
          expirationDate: customerPackage.expirationDate,
          remainingFreezeChances: customerPackage.remainingFreezeChances,
          status: customerPackage.status,
        },
        targetId: customerPackage.id,
        targetType: "CustomerPackage",
      });
    });
  } catch (error) {
    redirect(
      customerActionPath(
        formData,
        customerId,
        freezeErrorQuery(error, "package-freeze-unavailable"),
      ),
    );
  }

  revalidatePackageWorkflow(customerId);
  redirect(customerActionPath(formData, customerId, "status=package-frozen"));
}

export async function adminReactivateCustomerPackageAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const packageFreezeId = optionalText(formData, "packageFreezeId", 100);
  const notes = optionalText(formData, "notes", 1000);

  if (!customerId || !customerCode || !customerPackageId) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-package-action"),
    );
  }

  let reactivatedStatus: "ACTIVE" | "EXPIRED";

  try {
    reactivatedStatus = await db.$transaction(async (transaction) => {
      const customerPackage = await transaction.customerPackage.findFirst({
        include: {
          customer: {
            select: { customerCode: true, fullName: true, id: true },
          },
          freezes: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: {
              createdAt: true,
              customerPackageServiceId: true,
              id: true,
              mode: true,
              notes: true,
              originalExpirationDate: true,
              plannedDays: true,
              plannedEndDate: true,
              startDate: true,
              updatedAt: true,
            },
            take: 1,
            where: {
              ...(packageFreezeId ? { id: packageFreezeId } : {}),
              customerPackageServiceId: null,
              status: "ACTIVE",
            },
          },
          package: {
            select: { name: true },
          },
        },
        where: {
          customer: { deletedAt: null },
          customerId,
          deletedAt: null,
          id: customerPackageId,
        },
      });

      if (
        !customerPackage ||
        customerPackage.customer.customerCode !== customerCode
      ) {
        throw new AdvancedFreezeError("invalid-package-action");
      }

      const activeFreeze = customerPackage.freezes[0] ?? null;
      if (!activeFreeze) {
        throw new AdvancedFreezeError("package-not-frozen");
      }

      const actualEndDate = new Date();
      if (actualEndDate < activeFreeze.startDate) {
        throw new AdvancedFreezeError("package-not-frozen");
      }

      const actualDays = calculateActualFrozenDays(
        activeFreeze.startDate,
        actualEndDate,
      );
      const resultingExpirationDate = calculateAdjustedExpiration(
        activeFreeze.originalExpirationDate,
        actualDays,
      );
      const nextStatus = activeStatusForExpiration(resultingExpirationDate);
      const freezeUpdateData: Prisma.PackageFreezeUncheckedUpdateManyInput = {
        actualDays,
        actualEndDate,
        reactivatedById: user.id,
        resultingExpirationDate,
        status: "REACTIVATED",
      };
      const nextNotes = appendFreezeNote(
        activeFreeze.notes,
        "Reactivation note",
        notes,
      );

      if (nextNotes !== undefined) {
        freezeUpdateData.notes = nextNotes;
      }

      const freezeUpdate = await transaction.packageFreeze.updateMany({
        data: freezeUpdateData,
        where: {
          id: activeFreeze.id,
          status: "ACTIVE",
          updatedAt: activeFreeze.updatedAt,
        },
      });

      if (freezeUpdate.count !== 1) {
        throw new AdvancedFreezeError("package-status-stale");
      }

      const packageUpdate = await transaction.customerPackage.updateMany({
        data: {
          expirationDate: resultingExpirationDate,
          reactivatedAt: actualEndDate,
          status: nextStatus,
        },
        where: {
          customerId,
          deletedAt: null,
          id: customerPackage.id,
          status: { in: ["ACTIVE", "FROZEN"] },
          updatedAt: customerPackage.updatedAt,
        },
      });

      if (packageUpdate.count !== 1) {
        throw new AdvancedFreezeError("package-status-stale");
      }

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_REACTIVATION",
        actorId: user.id,
        customerId: customerPackage.customer.id,
        description: `Advanced reactivation for ${membershipDisplayName(customerPackage)} on ${customerPackage.customer.customerCode}: ${customerPackage.customer.fullName}${nextStatus === "EXPIRED" ? " as expired" : ""}.`,
        newValue: {
          actualDays,
          actualEndDate,
          freezeId: activeFreeze.id,
          originalExpirationDate: activeFreeze.originalExpirationDate,
          resultingExpirationDate,
          status: nextStatus,
        },
        oldValue: {
          expirationDate: customerPackage.expirationDate,
          freezeId: activeFreeze.id,
          plannedDays: activeFreeze.plannedDays,
          plannedEndDate: activeFreeze.plannedEndDate,
          status: customerPackage.status,
        },
        targetId: customerPackage.id,
        targetType: "CustomerPackage",
      });

      return nextStatus;
    });
  } catch (error) {
    redirect(
      customerActionPath(
        formData,
        customerId,
        freezeErrorQuery(error, "package-reactivation-unavailable"),
      ),
    );
  }

  revalidatePackageWorkflow(customerId);
  redirect(
    customerActionPath(
      formData,
      customerId,
      reactivatedStatus === "EXPIRED"
        ? "status=package-reactivated-expired"
        : "status=package-reactivated",
    ),
  );
}

export async function adminRetroactiveFreezeCustomerPackageAction(
  formData: FormData,
) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const retroactiveStartDate = requiredDate(formData, "retroactiveStartDate");
  const actualDays = positiveInteger(formData, "actualDays");
  const notes = optionalText(formData, "notes", 1000);

  if (!customerId || !customerCode || !customerPackageId) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-package-action"),
    );
  }

  if (
    !retroactiveStartDate ||
    actualDays === null ||
    !validateFreezeDays(actualDays)
  ) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-retroactive-freeze"),
    );
  }

  try {
    await db.$transaction(async (transaction) => {
      const customerPackage = await transaction.customerPackage.findFirst({
        include: {
          customer: {
            select: { customerCode: true, fullName: true, id: true },
          },
          freezes: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: {
              actualDays: true,
              customerPackageServiceId: true,
              id: true,
              plannedDays: true,
              status: true,
            },
          },
          package: {
            select: { deletedAt: true, isActive: true, name: true },
          },
        },
        where: {
          customer: { deletedAt: null },
          customerId,
          deletedAt: null,
          id: customerPackageId,
        },
      });

      if (
        !customerPackage ||
        customerPackage.customer.customerCode !== customerCode
      ) {
        throw new AdvancedFreezeError("invalid-package-action");
      }

      if (
        customerPackage.freezes.some(
          (freeze) => freeze.status === "ACTIVE" && isMembershipFreeze(freeze),
        )
      ) {
        throw new AdvancedFreezeError("package-active-freeze");
      }

      if (
        !["ACTIVE", "EXPIRED"].includes(customerPackage.status) ||
        customerPackage.remainingSessions <= 0 ||
        Boolean(
          customerPackage.package &&
            (customerPackage.package.deletedAt ||
              !customerPackage.package.isActive),
        )
      ) {
        throw new AdvancedFreezeError("package-not-freezable");
      }

      const actualEndDate = calculatePlannedFreezeEndDate(
        retroactiveStartDate,
        actualDays,
      );

      if (actualEndDate > new Date()) {
        throw new AdvancedFreezeError("invalid-retroactive-freeze");
      }

      const freezePolicy = validateFreezePolicy({
        freezes: customerPackage.freezes,
        remainingFreezeChances: customerPackage.remainingFreezeChances,
        requestedDays: actualDays,
      });

      if (!freezePolicy.ok) {
        throw new AdvancedFreezeError(
          freezePolicy.code,
          freezePolicy.usage.remainingFreezeDays,
        );
      }

      const resultingExpirationDate = calculateAdjustedExpiration(
        customerPackage.expirationDate,
        actualDays,
      );
      const nextStatus = activeStatusForExpiration(resultingExpirationDate);
      const update = await transaction.customerPackage.updateMany({
        data: {
          expirationDate: resultingExpirationDate,
          reactivatedAt: actualEndDate,
          remainingFreezeChances: { decrement: 1 },
          status: nextStatus,
        },
        where: {
          customerId,
          deletedAt: null,
          id: customerPackage.id,
          remainingFreezeChances: { gt: 0 },
          status: { in: ["ACTIVE", "EXPIRED"] },
          updatedAt: customerPackage.updatedAt,
        },
      });

      if (update.count !== 1) {
        throw new AdvancedFreezeError("package-status-stale");
      }

      const freeze = await transaction.packageFreeze.create({
        data: {
          actualDays,
          actualEndDate,
          createdById: user.id,
          customerPackageId: customerPackage.id,
          mode: "RETROACTIVE",
          notes,
          originalExpirationDate: customerPackage.expirationDate,
          plannedDays: actualDays,
          plannedEndDate: actualEndDate,
          reactivatedById: user.id,
          resultingExpirationDate,
          startDate: retroactiveStartDate,
          status: "REACTIVATED",
        },
      });

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_FREEZE",
        actorId: user.id,
        customerId: customerPackage.customer.id,
        description: `Advanced retroactive freeze for ${membershipDisplayName(customerPackage)} on ${customerPackage.customer.customerCode}: ${customerPackage.customer.fullName} for ${actualDays} day${actualDays === 1 ? "" : "s"}.`,
        newValue: {
          actualDays,
          actualEndDate,
          freezeId: freeze.id,
          freezeCountAfter: freezePolicy.usage.confirmedFreezeCount + 1,
          freezeCountBefore: freezePolicy.usage.confirmedFreezeCount,
          freezeDaysRemainingAfter: Math.max(
            0,
            freezePolicy.usage.remainingFreezeDays - actualDays,
          ),
          freezeDaysUsedAfter: freezePolicy.usage.usedFreezeDays + actualDays,
          freezeDaysUsedBefore: freezePolicy.usage.usedFreezeDays,
          freezeNumber: freezePolicy.freezeNumber,
          mode: freeze.mode,
          paidFreezeNoticeRequired: freezePolicy.isPaid,
          remainingFreezeChances:
            customerPackage.remainingFreezeChances - 1,
          retroactiveStartDate,
          resultingExpirationDate,
          status: nextStatus,
        },
        oldValue: {
          expirationDate: customerPackage.expirationDate,
          remainingFreezeChances: customerPackage.remainingFreezeChances,
          status: customerPackage.status,
        },
        targetId: customerPackage.id,
        targetType: "CustomerPackage",
      });
    });
  } catch (error) {
    redirect(
      customerActionPath(
        formData,
        customerId,
        freezeErrorQuery(error, "retroactive-freeze-unavailable"),
      ),
    );
  }

  revalidatePackageWorkflow(customerId);
  redirect(
    customerActionPath(formData, customerId, "status=package-retroactive-frozen"),
  );
}

export async function adminFreezeCustomerPackageServiceAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const serviceId = optionalText(formData, "serviceId", 100);
  const startDate = requiredDate(formData, "startDate");
  const plannedDays = positiveInteger(formData, "plannedDays");
  const notes = optionalText(formData, "notes", 1000);

  if (!customerId || !customerCode || !customerPackageId || !serviceId) {
    redirect(customerActionPath(formData, customerId, "error=invalid-service"));
  }

  if (!startDate || startDate < startOfTodayUtc()) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-freeze-dates"),
    );
  }

  if (plannedDays === null || !validateFreezeDays(plannedDays)) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-freeze-days"),
    );
  }

  try {
    await db.$transaction(async (transaction) => {
      const service = await transaction.customerPackageService.findFirst({
        include: {
          customerPackage: {
            include: {
              customer: {
                select: { customerCode: true, fullName: true, id: true },
              },
              freezes: {
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                select: {
                  actualDays: true,
                  customerPackageServiceId: true,
                  id: true,
                  plannedDays: true,
                  status: true,
                },
              },
              package: {
                select: { deletedAt: true, isActive: true, name: true },
              },
            },
          },
          freezes: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { id: true, status: true },
          },
          package: { select: { name: true } },
        },
        where: {
          customerPackageId,
          customerPackage: {
            customer: { deletedAt: null },
            customerId,
            deletedAt: null,
          },
          deletedAt: null,
          id: serviceId,
        },
      });

      if (
        !service ||
        service.customerPackage.customer.customerCode !== customerCode
      ) {
        throw new AdvancedFreezeError("invalid-service");
      }

      const membership = service.customerPackage;
      if (
        membership.status !== "ACTIVE" ||
        membership.expirationDate < startOfTodayUtc() ||
        Boolean(
          membership.package &&
            (membership.package.deletedAt || !membership.package.isActive),
        )
      ) {
        throw new AdvancedFreezeError("package-not-freezable");
      }

      if (
        membership.freezes.some(
          (freeze) => freeze.status === "ACTIVE" && isMembershipFreeze(freeze),
        )
      ) {
        throw new AdvancedFreezeError("package-active-freeze");
      }

      if (service.freezes.some((freeze) => freeze.status === "ACTIVE")) {
        throw new AdvancedFreezeError("service-active-freeze");
      }

      const plannedEndDate = calculatePlannedFreezeEndDate(
        startDate,
        plannedDays,
      );
      const dateError = serviceFreezeDateError({
        retroactive: false,
        serviceEndDate: service.endDate,
        serviceStartDate: service.startDate,
        startDate,
      });

      if (dateError) {
        throw new AdvancedFreezeError(dateError);
      }
      const originalServiceEndDate = service.endDate;

      if (!originalServiceEndDate) {
        throw new AdvancedFreezeError("service-freeze-dates-required");
      }

      const freezePolicy = validateFreezePolicy({
        freezes: membership.freezes,
        remainingFreezeChances: membership.remainingFreezeChances,
        requestedDays: plannedDays,
      });

      if (!freezePolicy.ok) {
        throw new AdvancedFreezeError(
          freezePolicy.code,
          freezePolicy.usage.remainingFreezeDays,
        );
      }

      const resultingServiceEndDate = calculateAdjustedExpiration(
        originalServiceEndDate,
        plannedDays,
      );
      const membershipUpdate = await transaction.customerPackage.updateMany({
        data: { remainingFreezeChances: { decrement: 1 } },
        where: {
          customerId,
          deletedAt: null,
          id: membership.id,
          remainingFreezeChances: { gt: 0 },
          status: "ACTIVE",
          updatedAt: membership.updatedAt,
        },
      });

      if (membershipUpdate.count !== 1) {
        throw new AdvancedFreezeError("package-status-stale");
      }

      const serviceUpdate =
        await transaction.customerPackageService.updateMany({
          data: { endDate: resultingServiceEndDate },
          where: {
            customerPackageId: membership.id,
            deletedAt: null,
            id: service.id,
            isActive: true,
            updatedAt: service.updatedAt,
          },
        });

      if (serviceUpdate.count !== 1) {
        throw new AdvancedFreezeError("service-stale");
      }

      const freeze = await transaction.packageFreeze.create({
        data: {
          createdById: user.id,
          customerPackageId: membership.id,
          customerPackageServiceId: service.id,
          mode: "NORMAL",
          notes,
          originalExpirationDate: membership.expirationDate,
          originalServiceEndDate,
          plannedDays,
          plannedEndDate,
          resultingExpirationDate: membership.expirationDate,
          resultingServiceEndDate,
          startDate,
          status: "ACTIVE",
        },
      });

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_FREEZE",
        actorId: user.id,
        customerId: membership.customer.id,
        description: `Service freeze for ${serviceLineDisplayName(service)} inside ${membershipDisplayName(membership)} on ${membership.customer.customerCode}: ${membership.customer.fullName} for ${plannedDays} day${plannedDays === 1 ? "" : "s"}.`,
        newValue: {
          freezeId: freeze.id,
          freezeNumber: freezePolicy.freezeNumber,
          membershipName: membershipDisplayName(membership),
          mode: freeze.mode,
          originalServiceEndDate,
          plannedDays,
          plannedEndDate,
          remainingFreezeChances: membership.remainingFreezeChances - 1,
          resultingServiceEndDate,
          serviceName: serviceLineDisplayName(service),
          startDate,
          targetScope: "SERVICE",
        },
        oldValue: {
          remainingFreezeChances: membership.remainingFreezeChances,
          serviceEndDate: originalServiceEndDate,
        },
        targetId: freeze.id,
        targetType: "PackageFreeze",
      });
    });
  } catch (error) {
    redirect(
      customerActionPath(
        formData,
        customerId,
        freezeErrorQuery(error, "service-freeze-unavailable"),
      ),
    );
  }

  revalidatePackageWorkflow(customerId);
  redirect(customerActionPath(formData, customerId, "status=service-frozen"));
}

export async function adminRetroactiveFreezeCustomerPackageServiceAction(
  formData: FormData,
) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const serviceId = optionalText(formData, "serviceId", 100);
  const retroactiveStartDate = requiredDate(formData, "retroactiveStartDate");
  const actualDays = positiveInteger(formData, "actualDays");
  const notes = optionalText(formData, "notes", 1000);

  if (!customerId || !customerCode || !customerPackageId || !serviceId) {
    redirect(customerActionPath(formData, customerId, "error=invalid-service"));
  }

  if (
    !retroactiveStartDate ||
    actualDays === null ||
    !validateFreezeDays(actualDays)
  ) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-retroactive-freeze"),
    );
  }

  try {
    await db.$transaction(async (transaction) => {
      const service = await transaction.customerPackageService.findFirst({
        include: {
          customerPackage: {
            include: {
              customer: {
                select: { customerCode: true, fullName: true, id: true },
              },
              freezes: {
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                select: {
                  actualDays: true,
                  customerPackageServiceId: true,
                  id: true,
                  plannedDays: true,
                  status: true,
                },
              },
            },
          },
          freezes: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { id: true, status: true },
          },
          package: { select: { name: true } },
        },
        where: {
          customerPackageId,
          customerPackage: {
            customer: { deletedAt: null },
            customerId,
            deletedAt: null,
          },
          deletedAt: null,
          id: serviceId,
        },
      });

      if (
        !service ||
        service.customerPackage.customer.customerCode !== customerCode
      ) {
        throw new AdvancedFreezeError("invalid-service");
      }

      const membership = service.customerPackage;
      if (!["ACTIVE", "EXPIRED"].includes(membership.status)) {
        throw new AdvancedFreezeError("package-not-freezable");
      }

      if (
        membership.freezes.some(
          (freeze) => freeze.status === "ACTIVE" && isMembershipFreeze(freeze),
        )
      ) {
        throw new AdvancedFreezeError("package-active-freeze");
      }

      if (service.freezes.some((freeze) => freeze.status === "ACTIVE")) {
        throw new AdvancedFreezeError("service-active-freeze");
      }

      const actualEndDate = calculatePlannedFreezeEndDate(
        retroactiveStartDate,
        actualDays,
      );
      const dateError = serviceFreezeDateError({
        actualEndDate,
        retroactive: true,
        serviceEndDate: service.endDate,
        serviceStartDate: service.startDate,
        startDate: retroactiveStartDate,
      });

      if (dateError) {
        throw new AdvancedFreezeError(dateError);
      }
      const originalServiceEndDate = service.endDate;

      if (!originalServiceEndDate) {
        throw new AdvancedFreezeError("service-freeze-dates-required");
      }

      const freezePolicy = validateFreezePolicy({
        freezes: membership.freezes,
        remainingFreezeChances: membership.remainingFreezeChances,
        requestedDays: actualDays,
      });

      if (!freezePolicy.ok) {
        throw new AdvancedFreezeError(
          freezePolicy.code,
          freezePolicy.usage.remainingFreezeDays,
        );
      }

      const resultingServiceEndDate = calculateAdjustedExpiration(
        originalServiceEndDate,
        actualDays,
      );
      const membershipUpdate = await transaction.customerPackage.updateMany({
        data: { remainingFreezeChances: { decrement: 1 } },
        where: {
          customerId,
          deletedAt: null,
          id: membership.id,
          remainingFreezeChances: { gt: 0 },
          status: { in: ["ACTIVE", "EXPIRED"] },
          updatedAt: membership.updatedAt,
        },
      });

      if (membershipUpdate.count !== 1) {
        throw new AdvancedFreezeError("package-status-stale");
      }

      const serviceUpdate =
        await transaction.customerPackageService.updateMany({
          data: { endDate: resultingServiceEndDate },
          where: {
            customerPackageId: membership.id,
            deletedAt: null,
            id: service.id,
            updatedAt: service.updatedAt,
          },
        });

      if (serviceUpdate.count !== 1) {
        throw new AdvancedFreezeError("service-stale");
      }

      const freeze = await transaction.packageFreeze.create({
        data: {
          actualDays,
          actualEndDate,
          createdById: user.id,
          customerPackageId: membership.id,
          customerPackageServiceId: service.id,
          mode: "RETROACTIVE",
          notes,
          originalExpirationDate: membership.expirationDate,
          originalServiceEndDate,
          plannedDays: actualDays,
          plannedEndDate: actualEndDate,
          reactivatedById: user.id,
          resultingExpirationDate: membership.expirationDate,
          resultingServiceEndDate,
          startDate: retroactiveStartDate,
          status: "REACTIVATED",
        },
      });

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_FREEZE",
        actorId: user.id,
        customerId: membership.customer.id,
        description: `Retroactive service freeze for ${serviceLineDisplayName(service)} inside ${membershipDisplayName(membership)} on ${membership.customer.customerCode}: ${membership.customer.fullName} for ${actualDays} day${actualDays === 1 ? "" : "s"}.`,
        newValue: {
          actualDays,
          actualEndDate,
          freezeId: freeze.id,
          freezeNumber: freezePolicy.freezeNumber,
          membershipName: membershipDisplayName(membership),
          mode: freeze.mode,
          originalServiceEndDate,
          remainingFreezeChances: membership.remainingFreezeChances - 1,
          resultingServiceEndDate,
          retroactiveStartDate,
          serviceName: serviceLineDisplayName(service),
          targetScope: "SERVICE",
        },
        oldValue: {
          remainingFreezeChances: membership.remainingFreezeChances,
          serviceEndDate: originalServiceEndDate,
        },
        targetId: freeze.id,
        targetType: "PackageFreeze",
      });
    });
  } catch (error) {
    redirect(
      customerActionPath(
        formData,
        customerId,
        freezeErrorQuery(error, "service-freeze-unavailable"),
      ),
    );
  }

  revalidatePackageWorkflow(customerId);
  redirect(
    customerActionPath(formData, customerId, "status=service-retroactive-frozen"),
  );
}

export async function adminReactivateCustomerPackageServiceAction(
  formData: FormData,
) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const serviceId = optionalText(formData, "serviceId", 100);
  const packageFreezeId = optionalText(formData, "packageFreezeId", 100);
  const notes = optionalText(formData, "notes", 1000);

  if (!customerId || !customerCode || !customerPackageId || !serviceId) {
    redirect(customerActionPath(formData, customerId, "error=invalid-service"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const service = await transaction.customerPackageService.findFirst({
        include: {
          customerPackage: {
            select: {
              customer: {
                select: { customerCode: true, fullName: true, id: true },
              },
              membershipName: true,
              package: { select: { name: true } },
            },
          },
          freezes: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: {
              id: true,
              notes: true,
              originalServiceEndDate: true,
              plannedDays: true,
              plannedEndDate: true,
              startDate: true,
              updatedAt: true,
            },
            take: 1,
            where: {
              ...(packageFreezeId ? { id: packageFreezeId } : {}),
              status: "ACTIVE",
            },
          },
          package: { select: { name: true } },
        },
        where: {
          customerPackageId,
          customerPackage: {
            customer: { deletedAt: null },
            customerId,
            deletedAt: null,
          },
          deletedAt: null,
          id: serviceId,
        },
      });

      if (
        !service ||
        service.customerPackage.customer.customerCode !== customerCode
      ) {
        throw new AdvancedFreezeError("invalid-service");
      }

      const activeFreeze = service.freezes[0] ?? null;
      if (!activeFreeze?.originalServiceEndDate) {
        throw new AdvancedFreezeError("service-not-frozen");
      }

      const actualEndDate = new Date();
      if (actualEndDate < activeFreeze.startDate) {
        throw new AdvancedFreezeError("service-not-frozen");
      }

      const actualDays = calculateActualFrozenDays(
        activeFreeze.startDate,
        actualEndDate,
      );
      const resultingServiceEndDate = calculateAdjustedExpiration(
        activeFreeze.originalServiceEndDate,
        actualDays,
      );
      const nextNotes = appendFreezeNote(
        activeFreeze.notes,
        "Service reactivation note",
        notes,
      );
      const freezeUpdateData: Prisma.PackageFreezeUncheckedUpdateManyInput = {
        actualDays,
        actualEndDate,
        reactivatedById: user.id,
        resultingServiceEndDate,
        status: "REACTIVATED",
      };

      if (nextNotes !== undefined) {
        freezeUpdateData.notes = nextNotes;
      }

      const freezeUpdate = await transaction.packageFreeze.updateMany({
        data: freezeUpdateData,
        where: {
          id: activeFreeze.id,
          status: "ACTIVE",
          updatedAt: activeFreeze.updatedAt,
        },
      });

      if (freezeUpdate.count !== 1) {
        throw new AdvancedFreezeError("package-status-stale");
      }

      const serviceUpdate =
        await transaction.customerPackageService.updateMany({
          data: { endDate: resultingServiceEndDate },
          where: {
            customerPackageId,
            deletedAt: null,
            id: service.id,
            updatedAt: service.updatedAt,
          },
        });

      if (serviceUpdate.count !== 1) {
        throw new AdvancedFreezeError("service-stale");
      }

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_REACTIVATION",
        actorId: user.id,
        customerId: service.customerPackage.customer.id,
        description: `Service reactivation for ${serviceLineDisplayName(service)} inside ${membershipDisplayName(service.customerPackage)} on ${service.customerPackage.customer.customerCode}: ${service.customerPackage.customer.fullName}.`,
        newValue: {
          actualDays,
          actualEndDate,
          freezeId: activeFreeze.id,
          membershipName: membershipDisplayName(service.customerPackage),
          originalServiceEndDate: activeFreeze.originalServiceEndDate,
          resultingServiceEndDate,
          serviceName: serviceLineDisplayName(service),
          targetScope: "SERVICE",
        },
        oldValue: {
          plannedDays: activeFreeze.plannedDays,
          plannedEndDate: activeFreeze.plannedEndDate,
          serviceEndDate: service.endDate,
        },
        targetId: activeFreeze.id,
        targetType: "PackageFreeze",
      });
    });
  } catch (error) {
    redirect(
      customerActionPath(
        formData,
        customerId,
        freezeErrorQuery(error, "service-reactivation-unavailable"),
      ),
    );
  }

  revalidatePackageWorkflow(customerId);
  redirect(customerActionPath(formData, customerId, "status=service-reactivated"));
}
