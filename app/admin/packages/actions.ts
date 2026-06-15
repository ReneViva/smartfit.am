"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffRole } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { writeAuditLog } from "../../../lib/logging";

const PACKAGES_PATH = "/admin/packages";
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const PRICE_PATTERN = /^\d{1,8}(?:\.\d{1,2})?$/;

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

function nonNegativeIntegerOrZero(formData: FormData, name: string) {
  const rawValue = optionalText(formData, name, 20);

  if (rawValue === null) {
    return 0;
  }

  const value = Number(rawValue);
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function timeLabel(startTime: string | null, endTime: string | null) {
  if (startTime && endTime) {
    return `Available ${startTime} - ${endTime}`;
  }

  return endTime ? `Available before ${endTime}` : null;
}

export async function savePackageAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);
  const name = optionalText(formData, "name", 200);
  const packageType = optionalText(formData, "packageType", 200);
  const price = optionalText(formData, "price", 30);
  const sessionCount = nonNegativeInteger(formData, "sessionCount");
  const defaultGuestPasses = nonNegativeIntegerOrZero(
    formData,
    "defaultGuestPasses",
  );
  const assignedCoachId = optionalText(formData, "assignedCoachId", 100);
  const hasTimeRestriction = formData.get("hasTimeRestriction") === "on";
  const rawStartTime = optionalText(formData, "allowedStartTime", 5);
  const rawEndTime = optionalText(formData, "allowedEndTime", 5);
  const rawRestrictionLabel = optionalText(
    formData,
    "timeRestrictionLabel",
    500,
  );

  if (!name || !packageType || !price) {
    redirect(`${PACKAGES_PATH}?error=invalid-required`);
  }

  if (!PRICE_PATTERN.test(price)) {
    redirect(`${PACKAGES_PATH}?error=invalid-price`);
  }

  if (sessionCount === null) {
    redirect(`${PACKAGES_PATH}?error=invalid-sessions`);
  }

  if (defaultGuestPasses === null) {
    redirect(`${PACKAGES_PATH}?error=invalid-guest-passes`);
  }

  if (
    hasTimeRestriction &&
    ((rawStartTime && !TIME_PATTERN.test(rawStartTime)) ||
      (rawEndTime && !TIME_PATTERN.test(rawEndTime)))
  ) {
    redirect(`${PACKAGES_PATH}?error=invalid-time`);
  }

  if (
    hasTimeRestriction &&
    rawStartTime &&
    rawEndTime &&
    rawStartTime >= rawEndTime
  ) {
    redirect(`${PACKAGES_PATH}?error=invalid-time-order`);
  }

  if (hasTimeRestriction && !rawEndTime && !rawRestrictionLabel) {
    redirect(`${PACKAGES_PATH}?error=incomplete-restriction`);
  }

  if (assignedCoachId) {
    const assignedCoach = await db.coach.findFirst({
      select: { id: true },
      where: {
        deletedAt: null,
        id: assignedCoachId,
      },
    });

    if (!assignedCoach) {
      redirect(`${PACKAGES_PATH}?error=invalid-coach`);
    }
  }

  const allowedStartTime = hasTimeRestriction ? rawStartTime : null;
  const allowedEndTime = hasTimeRestriction ? rawEndTime : null;
  const restrictionLabel = hasTimeRestriction
    ? rawRestrictionLabel ?? timeLabel(allowedStartTime, allowedEndTime)
    : null;
  const data = {
    allowedEndTime,
    allowedStartTime,
    assignedCoachId,
    defaultGuestPasses,
    description: optionalText(formData, "description", 2000),
    hasTimeRestriction,
    isActive: formData.get("isActive") === "on",
    name,
    packageType,
    price,
    sessionCount,
    timeRestrictionLabel: restrictionLabel,
  };

  try {
    await db.$transaction(async (transaction) => {
      if (id) {
        const existing = await transaction.package.findFirst({
          where: {
            deletedAt: null,
            id,
          },
        });

        if (!existing) {
          throw new Error("Package not found.");
        }

        const saved = await transaction.package.update({
          data,
          where: { id },
        });

        await writeAuditLog(transaction, {
          actionType: "PACKAGE_EDIT",
          actorId: user.id,
          description: `Updated package: ${saved.name}.`,
          newValue: saved,
          oldValue: existing,
          targetId: saved.id,
          targetType: "Package",
        });
        return;
      }

      const saved = await transaction.package.create({ data });

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_EDIT",
        actorId: user.id,
        description: `Created package: ${saved.name}.`,
        newValue: saved,
        targetId: saved.id,
        targetType: "Package",
      });
    });
  } catch {
    redirect(`${PACKAGES_PATH}?error=unavailable`);
  }

  revalidatePath("/");
  revalidatePath("/packages");
  revalidatePath(PACKAGES_PATH);
  redirect(`${PACKAGES_PATH}?status=saved`);
}
