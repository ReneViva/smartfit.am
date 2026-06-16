"use server";

import {
  CustomerPackageStatus,
  CustomerStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffRole } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { writeAuditLog } from "../../../lib/logging";
import {
  calculateActualFrozenDays,
  calculateAdjustedExpiration,
  calculatePlannedFreezeEndDate,
  validateFreezeDays,
  validateRemainingFreezeChances,
} from "../../../lib/package-freezes";

const CUSTOMERS_PATH = "/admin/customers";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const customerStatuses = new Set(Object.values(CustomerStatus));
const packageStatuses = new Set(Object.values(CustomerPackageStatus));

type CustomerCreateField =
  | "birthDate"
  | "customerCode"
  | "fullName"
  | "status";

export type CustomerCreateValues = {
  birthDate: string;
  customerCode: string;
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
    birthDate: draftText(formData, "birthDate", 10),
    customerCode: draftText(formData, "customerCode", 100),
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

function revalidateCustomerPages() {
  revalidatePath("/admin");
  revalidatePath(CUSTOMERS_PATH);
}

function startOfTodayUtc() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function activeStatusForExpiration(expirationDate: Date) {
  return expirationDate < startOfTodayUtc() ? "EXPIRED" : "ACTIVE";
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

  if (!rawStatus || !customerStatuses.has(rawStatus as CustomerStatus)) {
    fieldErrors.status = "Choose a valid customer status.";
  }

  if (
    !customerCode ||
    !fullName ||
    !birthDate ||
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
          birthDate,
          customerCode,
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
    birthDate,
    customerCode,
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
        defaultFreezeChances: true,
        defaultGuestPasses: true,
        id: true,
        name: true,
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
          coachId,
          customerId,
          expirationDate,
          initialGuestPasses,
          initialSessions,
          packageId,
          remainingGuestPasses,
          remainingFreezeChances: gymPackage.defaultFreezeChances,
          remainingSessions,
          status: rawStatus as CustomerPackageStatus,
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
          select: { id: true, isActive: true, name: true },
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
          coachId,
          expirationDate,
          initialGuestPasses,
          initialSessions,
          packageId,
          remainingGuestPasses,
          remainingFreezeChances,
          remainingSessions,
          status: nextStatus,
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
        description: `Updated assigned package ${existing.package.name} for ${existing.customer.customerCode}: ${existing.customer.fullName}.`,
        newValue: {
          activationDate: saved.activationDate,
          coachId: saved.coachId,
          coachName: coachName(nextCoach),
          expirationDate: saved.expirationDate,
          initialGuestPasses: saved.initialGuestPasses,
          initialSessions: saved.initialSessions,
          packageId: saved.packageId,
          packageName: gymPackage.name,
          remainingGuestPasses: saved.remainingGuestPasses,
          remainingFreezeChances: saved.remainingFreezeChances,
          remainingSessions: saved.remainingSessions,
          status: saved.status,
        },
        oldValue: {
          activationDate: existing.activationDate,
          coachId: existing.coachId,
          coachName: coachName(existing.coach),
          expirationDate: existing.expirationDate,
          initialGuestPasses: existing.initialGuestPasses,
          initialSessions: existing.initialSessions,
          packageId: existing.packageId,
          packageName: existing.package.name,
          remainingGuestPasses: existing.remainingGuestPasses,
          remainingFreezeChances: existing.remainingFreezeChances,
          remainingSessions: existing.remainingSessions,
          status: existing.status,
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

export async function adminFreezeCustomerPackageAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const customerId = optionalText(formData, "customerId", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const customerPackageId = optionalText(formData, "customerPackageId", 100);
  const plannedDays = positiveInteger(formData, "plannedDays");
  const notes = optionalText(formData, "notes", 1000);

  if (!customerId || !customerCode || !customerPackageId) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-package-action"),
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
            select: { id: true },
            take: 1,
            where: { status: "ACTIVE" },
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

      if (customerPackage.freezes.length > 0) {
        throw new AdvancedFreezeError("package-active-freeze");
      }

      if (!validateRemainingFreezeChances(customerPackage)) {
        throw new AdvancedFreezeError("package-no-freeze-chances");
      }

      const today = startOfTodayUtc();
      if (
        customerPackage.status !== "ACTIVE" ||
        customerPackage.expirationDate < today ||
        customerPackage.remainingSessions <= 0 ||
        customerPackage.package.deletedAt ||
        !customerPackage.package.isActive
      ) {
        throw new AdvancedFreezeError("package-not-freezable");
      }

      const startDate = new Date();
      const plannedEndDate = calculatePlannedFreezeEndDate(
        startDate,
        plannedDays,
      );
      const resultingExpirationDate = calculateAdjustedExpiration(
        customerPackage.expirationDate,
        plannedDays,
      );
      const update = await transaction.customerPackage.updateMany({
        data: {
          expirationDate: resultingExpirationDate,
          frozenAt: startDate,
          reactivatedAt: null,
          remainingFreezeChances: { decrement: 1 },
          status: "FROZEN",
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
        description: `Advanced normal freeze for ${customerPackage.package.name} on ${customerPackage.customer.customerCode}: ${customerPackage.customer.fullName} for ${plannedDays} day${plannedDays === 1 ? "" : "s"}.`,
        newValue: {
          freezeId: freeze.id,
          mode: freeze.mode,
          originalExpirationDate: customerPackage.expirationDate,
          plannedDays,
          plannedEndDate,
          remainingFreezeChances:
            customerPackage.remainingFreezeChances - 1,
          resultingExpirationDate,
          startDate,
          status: "FROZEN",
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
        `error=${freezeErrorCode(error, "package-freeze-unavailable")}`,
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
      if (!activeFreeze || customerPackage.status !== "FROZEN") {
        throw new AdvancedFreezeError("package-not-frozen");
      }

      const actualEndDate = new Date();
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
          status: "FROZEN",
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
        description: `Advanced reactivation for ${customerPackage.package.name} on ${customerPackage.customer.customerCode}: ${customerPackage.customer.fullName}${nextStatus === "EXPIRED" ? " as expired" : ""}.`,
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
        `error=${freezeErrorCode(error, "package-reactivation-unavailable")}`,
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
  const notes = optionalText(formData, "notes", 1000);

  if (!customerId || !customerCode || !customerPackageId) {
    redirect(
      customerActionPath(formData, customerId, "error=invalid-package-action"),
    );
  }

  try {
    await db.$transaction(async (transaction) => {
      const [customerPackage, latestVisit] = await Promise.all([
        transaction.customerPackage.findFirst({
          include: {
            customer: {
              select: { customerCode: true, fullName: true, id: true },
            },
            freezes: {
              select: { id: true },
              take: 1,
              where: { status: "ACTIVE" },
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
        }),
        transaction.gymVisit.findFirst({
          orderBy: [{ checkedOutAt: "desc" }, { id: "desc" }],
          select: { checkedOutAt: true },
          where: {
            checkedOutAt: { not: null },
            customerId,
          },
        }),
      ]);

      if (
        !customerPackage ||
        customerPackage.customer.customerCode !== customerCode
      ) {
        throw new AdvancedFreezeError("invalid-package-action");
      }

      if (customerPackage.freezes.length > 0) {
        throw new AdvancedFreezeError("package-active-freeze");
      }

      if (!validateRemainingFreezeChances(customerPackage)) {
        throw new AdvancedFreezeError("package-no-freeze-chances");
      }

      if (
        !["ACTIVE", "EXPIRED"].includes(customerPackage.status) ||
        customerPackage.remainingSessions <= 0 ||
        customerPackage.package.deletedAt ||
        !customerPackage.package.isActive
      ) {
        throw new AdvancedFreezeError("package-not-freezable");
      }

      if (!latestVisit?.checkedOutAt) {
        throw new AdvancedFreezeError("package-no-checkout");
      }

      const actualEndDate = new Date();
      const actualDays = calculateActualFrozenDays(
        latestVisit.checkedOutAt,
        actualEndDate,
      );

      if (!validateFreezeDays(actualDays)) {
        throw new AdvancedFreezeError("invalid-retroactive-freeze");
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
          startDate: latestVisit.checkedOutAt,
          status: "REACTIVATED",
        },
      });

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_FREEZE",
        actorId: user.id,
        customerId: customerPackage.customer.id,
        description: `Advanced retroactive freeze for ${customerPackage.package.name} on ${customerPackage.customer.customerCode}: ${customerPackage.customer.fullName} for ${actualDays} day${actualDays === 1 ? "" : "s"} from latest checkout.`,
        newValue: {
          actualDays,
          actualEndDate,
          freezeId: freeze.id,
          latestCheckoutAt: latestVisit.checkedOutAt,
          mode: freeze.mode,
          remainingFreezeChances:
            customerPackage.remainingFreezeChances - 1,
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
        `error=${freezeErrorCode(error, "retroactive-freeze-unavailable")}`,
      ),
    );
  }

  revalidatePackageWorkflow(customerId);
  redirect(
    customerActionPath(formData, customerId, "status=package-retroactive-frozen"),
  );
}
