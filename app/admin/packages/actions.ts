"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffRole } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { writeAuditLog } from "../../../lib/logging";
import { MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE } from "../../../lib/package-freezes";
import {
  imageUploadErrorCode,
  uploadImageFromForm,
} from "../../../lib/uploads/storage";

const PACKAGES_PATH = "/admin/packages";
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const PRICE_PATTERN = /^\d{1,8}(?:\.\d{1,2})?$/;

function packagePath(errorOrStatus: string, id: string | null, isError = true) {
  const params = new URLSearchParams({
    [isError ? "error" : "status"]: errorOrStatus,
  });

  if (id) {
    params.set("package", id);
  }

  return `${PACKAGES_PATH}?${params.toString()}${id ? `#package-${encodeURIComponent(id)}` : ""}`;
}

function redirectPackageError(error: string, id: string | null): never {
  redirect(packagePath(error, id));
}

function optionalText(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return null;
  }

  return value.trim().slice(0, maxLength) || null;
}

function optionalPublicUrl(formData: FormData, name: string) {
  const value = optionalText(formData, name, 1000);

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function optionalPercent(formData: FormData, name: string) {
  const rawValue = optionalText(formData, name, 3);

  if (rawValue === null) {
    return null;
  }

  const value = Number(rawValue);

  return Number.isInteger(value) && value >= 1 && value <= 99 ? value : undefined;
}

function nonNegativeIntegerOrZero(formData: FormData, name: string) {
  const rawValue = optionalText(formData, name, 20);

  if (rawValue === null) {
    return 0;
  }

  const value = Number(rawValue);
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function nonNegativeIntegerOrDefault(
  formData: FormData,
  name: string,
  defaultValue: number,
) {
  const rawValue = optionalText(formData, name, 20);

  if (rawValue === null) {
    return defaultValue;
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
  const discountPrice = optionalText(formData, "discountPrice", 30);
  const discountRibbonPercent = optionalPercent(
    formData,
    "discountRibbonPercent",
  );
  const rawImageUrl = optionalText(formData, "imageUrl", 1000);
  const imageUrl = optionalPublicUrl(formData, "imageUrl");
  const sessionCount = nonNegativeIntegerOrZero(formData, "sessionCount");
  const defaultGuestPasses = nonNegativeIntegerOrZero(
    formData,
    "defaultGuestPasses",
  );
  const defaultFreezeChances = nonNegativeIntegerOrDefault(
    formData,
    "defaultFreezeChances",
    3,
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
  const categoryIds = Array.from(
    new Set(
      formData
        .getAll("categoryIds")
        .filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0 && value.length <= 100,
        ),
    ),
  );

  if (!name || !packageType || !price) {
    redirectPackageError("invalid-required", id);
  }

  if (!PRICE_PATTERN.test(price)) {
    redirectPackageError("invalid-price", id);
  }

  if (
    discountPrice &&
    (!PRICE_PATTERN.test(discountPrice) ||
      Number(discountPrice) <= 0 ||
      Number(discountPrice) >= Number(price))
  ) {
    redirectPackageError("invalid-discount-price", id);
  }

  if (discountRibbonPercent === undefined) {
    redirectPackageError("invalid-discount-ribbon", id);
  }

  if (sessionCount === null) {
    redirectPackageError("invalid-sessions", id);
  }

  if (defaultGuestPasses === null) {
    redirectPackageError("invalid-guest-passes", id);
  }

  if (
    defaultFreezeChances === null ||
    defaultFreezeChances > MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE
  ) {
    redirectPackageError("invalid-freeze-chances", id);
  }

  if (
    hasTimeRestriction &&
    ((rawStartTime && !TIME_PATTERN.test(rawStartTime)) ||
      (rawEndTime && !TIME_PATTERN.test(rawEndTime)))
  ) {
    redirectPackageError("invalid-time", id);
  }

  if (
    hasTimeRestriction &&
    rawStartTime &&
    rawEndTime &&
    rawStartTime >= rawEndTime
  ) {
    redirectPackageError("invalid-time-order", id);
  }

  if (hasTimeRestriction && !rawEndTime && !rawRestrictionLabel) {
    redirectPackageError("incomplete-restriction", id);
  }

  const [assignedCoach, assignableCategories] = await Promise.all([
    assignedCoachId
      ? db.coach.findFirst({
          select: { id: true },
          where: {
            deletedAt: null,
            id: assignedCoachId,
          },
        })
      : null,
    db.category.findMany({
      select: { id: true },
      where: { isArchived: false },
    }),
  ]);

  if (assignedCoachId && !assignedCoach) {
    redirectPackageError("invalid-coach", id);
  }

  const uploadedImageUrl = await uploadImageFromForm(
    formData,
    "packageImageUpload",
    { prefix: "package-images" },
  ).catch((error) => {
    redirectPackageError(`upload-${imageUploadErrorCode(error)}`, id);
  });

  if (rawImageUrl && !imageUrl && !uploadedImageUrl) {
    redirectPackageError("invalid-url", id);
  }

  const assignableCategoryIds = new Set(
    assignableCategories.map((category) => category.id),
  );
  if (
    (assignableCategories.length > 0 && categoryIds.length === 0) ||
    categoryIds.some((categoryId) => !assignableCategoryIds.has(categoryId))
  ) {
    redirectPackageError("invalid-categories", id);
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
    defaultFreezeChances,
    defaultGuestPasses,
    description: optionalText(formData, "description", 2000),
    discountPrice,
    discountRibbonPercent: discountPrice ? discountRibbonPercent : null,
    hasTimeRestriction,
    highlightOnPublicPackages:
      formData.get("highlightOnPublicPackages") === "on",
    imageUrl: uploadedImageUrl ?? imageUrl,
    isActive: formData.get("isActive") === "on",
    name,
    packageType,
    price,
    sessionCount,
    timeRestrictionLabel: restrictionLabel,
  };

  let savedPackageId: string;

  try {
    savedPackageId = await db.$transaction(async (transaction) => {
      if (id) {
        const existing = await transaction.package.findFirst({
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
          where: {
            deletedAt: null,
            id,
          },
        });

        if (!existing) {
          throw new Error("Package not found.");
        }

        await transaction.package.update({
          data,
          where: { id },
        });
        await transaction.packageCategory.deleteMany({
          where: { packageId: id },
        });
        if (categoryIds.length) {
          await transaction.packageCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              categoryId,
              packageId: id,
            })),
          });
        }
        const saved = await transaction.package.findUniqueOrThrow({
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
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
        return saved.id;
      }

      const saved = await transaction.package.create({
        data: {
          ...data,
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      await writeAuditLog(transaction, {
        actionType: "PACKAGE_EDIT",
        actorId: user.id,
        description: `Created package: ${saved.name}.`,
        newValue: saved,
        targetId: saved.id,
        targetType: "Package",
      });
      return saved.id;
    });
  } catch {
    redirectPackageError("unavailable", id);
  }

  revalidatePath("/");
  revalidatePath("/packages");
  revalidatePath(PACKAGES_PATH);
  revalidatePath("/admin/categories");
  redirect(packagePath("saved", savedPackageId, false));
}
