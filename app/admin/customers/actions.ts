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

const CUSTOMERS_PATH = "/admin/customers";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const customerStatuses = new Set(Object.values(CustomerStatus));
const packageStatuses = new Set(Object.values(CustomerPackageStatus));

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

export async function saveCustomerAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);
  const customerCode = optionalText(formData, "customerCode", 100);
  const fullName = optionalText(formData, "fullName", 240);
  const rawStatus = optionalText(formData, "status", 30);
  const assignedCoachId = optionalText(formData, "assignedCoachId", 100);

  if (
    !customerCode ||
    !fullName ||
    !rawStatus ||
    !customerStatuses.has(rawStatus as CustomerStatus)
  ) {
    redirect(`${CUSTOMERS_PATH}?error=invalid-customer`);
  }

  if (!(await coachExists(assignedCoachId))) {
    redirect(`${CUSTOMERS_PATH}?error=invalid-coach`);
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
    redirect(`${CUSTOMERS_PATH}?error=duplicate-code`);
  }

  const data = {
    assignedCoachId,
    customerCode,
    firstName: optionalText(formData, "firstName", 120),
    fullName,
    lastName: optionalText(formData, "lastName", 120),
    phone: optionalText(formData, "phone", 120),
    status: rawStatus as CustomerStatus,
  };

  try {
    await db.$transaction(async (transaction) => {
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
        return;
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
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect(`${CUSTOMERS_PATH}?error=duplicate-code`);
    }

    redirect(`${CUSTOMERS_PATH}?error=customer-unavailable`);
  }

  revalidateCustomerPages();
  redirect(`${CUSTOMERS_PATH}?status=customer-saved`);
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
  const rawStatus = optionalText(formData, "status", 30);

  if (
    !customerId ||
    !packageId ||
    !activationDate ||
    !expirationDate ||
    initialSessions === null ||
    remainingSessions === null ||
    !rawStatus ||
    !packageStatuses.has(rawStatus as CustomerPackageStatus)
  ) {
    redirect(`${CUSTOMERS_PATH}?error=invalid-assignment`);
  }

  if (expirationDate < activationDate) {
    redirect(`${CUSTOMERS_PATH}?error=invalid-date-order`);
  }

  if (!(await coachExists(coachId))) {
    redirect(`${CUSTOMERS_PATH}?error=invalid-coach`);
  }

  const [customer, gymPackage] = await Promise.all([
    db.customer.findFirst({
      select: { customerCode: true, fullName: true, id: true },
      where: { deletedAt: null, id: customerId },
    }),
    db.package.findFirst({
      select: { id: true, name: true },
      where: { deletedAt: null, id: packageId, isActive: true },
    }),
  ]);

  if (!customer) {
    redirect(`${CUSTOMERS_PATH}?error=invalid-customer`);
  }

  if (!gymPackage) {
    redirect(`${CUSTOMERS_PATH}?error=invalid-package`);
  }

  try {
    await db.$transaction(async (transaction) => {
      const saved = await transaction.customerPackage.create({
        data: {
          activationDate,
          coachId,
          customerId,
          expirationDate,
          initialSessions,
          packageId,
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
    redirect(`${CUSTOMERS_PATH}?error=assignment-unavailable`);
  }

  revalidateCustomerPages();
  redirect(`${CUSTOMERS_PATH}?status=package-assigned`);
}
