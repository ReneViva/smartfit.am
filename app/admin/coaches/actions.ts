"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffRole } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { writeAuditLog } from "../../../lib/logging";
import {
  imageUploadErrorCode,
  uploadImageFromForm,
} from "../../../lib/uploads/storage";

const COACHES_PATH = "/admin/coaches";

class CoachRecordError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

function coachPath(errorOrStatus: string, isError = true, view?: "archived") {
  const params = new URLSearchParams({
    [isError ? "error" : "status"]: errorOrStatus,
  });

  if (view) {
    params.set("view", view);
  }

  return `${COACHES_PATH}?${params.toString()}`;
}

function revalidateCoachPages() {
  revalidatePath("/");
  revalidatePath("/coaches");
  revalidatePath("/packages");
  revalidatePath(COACHES_PATH);
  revalidatePath("/admin/packages");
  revalidatePath("/admin/logs");
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

function selectedCategoryIds(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("categoryIds")
        .filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0 && value.length <= 100,
        ),
    ),
  );
}

export async function saveCoachAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);
  const firstName = optionalText(formData, "firstName", 120);
  const lastName = optionalText(formData, "lastName", 120);
  const specialty = optionalText(formData, "specialty", 200);
  const rawPhotoUrl = optionalText(formData, "photoUrl", 1000);
  const photoUrl = optionalPublicUrl(formData, "photoUrl");
  const categoryIds = selectedCategoryIds(formData);

  if (!firstName || !lastName || !specialty) {
    redirect(coachPath("invalid-required"));
  }

  if (categoryIds.length) {
    const assignableCategories = await db.category.findMany({
      select: { id: true },
      where: {
        id: { in: categoryIds },
        isArchived: false,
      },
    });
    const assignableCategoryIds = new Set(
      assignableCategories.map((category) => category.id),
    );

    if (categoryIds.some((categoryId) => !assignableCategoryIds.has(categoryId))) {
      redirect(coachPath("invalid-categories"));
    }
  }

  const uploadedPhotoUrl = await uploadImageFromForm(
    formData,
    "photoUpload",
    { prefix: "coaches" },
  ).catch((error) => {
    redirect(coachPath(`upload-${imageUploadErrorCode(error)}`));
  });

  if (rawPhotoUrl && !photoUrl && !uploadedPhotoUrl) {
    redirect(coachPath("invalid-url"));
  }

  const data = {
    contactInfo: optionalText(formData, "contactInfo", 500),
    description: optionalText(formData, "description", 2000),
    firstName,
    isActive: formData.get("isActive") === "on",
    lastName,
    photoUrl: uploadedPhotoUrl ?? photoUrl,
    specialty,
  };

  try {
    await db.$transaction(async (transaction) => {
      if (id) {
        const existing = await transaction.coach.findFirst({
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
          throw new Error("Coach not found.");
        }

        await transaction.coach.update({
          data,
          where: { id },
        });
        await transaction.coachCategory.deleteMany({
          where: { coachId: id },
        });
        if (categoryIds.length) {
          await transaction.coachCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              categoryId,
              coachId: id,
            })),
          });
        }
        const saved = await transaction.coach.findUniqueOrThrow({
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
          actionType: "COACH_EDIT",
          actorId: user.id,
          description: `Updated coach: ${saved.firstName} ${saved.lastName}.`,
          newValue: saved,
          oldValue: existing,
          targetId: saved.id,
          targetType: "Coach",
        });
        return;
      }

      const saved = await transaction.coach.create({
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
        actionType: "COACH_EDIT",
        actorId: user.id,
        description: `Created coach: ${saved.firstName} ${saved.lastName}.`,
        newValue: saved,
        targetId: saved.id,
        targetType: "Coach",
      });
    });
  } catch {
    redirect(coachPath("unavailable"));
  }

  revalidateCoachPages();
  redirect(coachPath("saved", false));
}

export async function archiveCoachAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);

  if (!id) {
    redirect(coachPath("invalid-record"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.coach.findFirst({
        where: { deletedAt: null, id },
      });

      if (!existing) {
        throw new Error("Coach not found.");
      }

      const deletedAt = new Date();
      const saved = await transaction.coach.update({
        data: { deletedAt },
        where: { id },
      });

      await writeAuditLog(transaction, {
        actionType: "COACH_EDIT",
        actorId: user.id,
        description: `Archived coach: ${saved.firstName} ${saved.lastName}.`,
        newValue: { deletedAt },
        oldValue: existing,
        targetId: saved.id,
        targetType: "Coach",
      });
    });
  } catch {
    redirect(coachPath("archive-unavailable"));
  }

  revalidateCoachPages();
  redirect(coachPath("archived", false, "archived"));
}

export async function restoreCoachAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);

  if (!id) {
    redirect(coachPath("invalid-record", true, "archived"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.coach.findFirst({
        where: { deletedAt: { not: null }, id },
      });

      if (!existing) {
        throw new Error("Coach not found.");
      }

      const saved = await transaction.coach.update({
        data: { deletedAt: null },
        where: { id },
      });

      await writeAuditLog(transaction, {
        actionType: "COACH_EDIT",
        actorId: user.id,
        description: `Restored coach: ${saved.firstName} ${saved.lastName}.`,
        newValue: { deletedAt: null },
        oldValue: existing,
        targetId: saved.id,
        targetType: "Coach",
      });
    });
  } catch {
    redirect(coachPath("restore-unavailable", true, "archived"));
  }

  revalidateCoachPages();
  redirect(coachPath("restored", false));
}

export async function deleteCoachAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);

  if (!id) {
    redirect(coachPath("invalid-record", true, "archived"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.coach.findFirst({
        where: { deletedAt: { not: null }, id },
      });

      if (!existing) {
        throw new Error("Coach not found.");
      }

      const relationCounts = await Promise.all([
        transaction.customer.count({ where: { assignedCoachId: id } }),
        transaction.package.count({ where: { assignedCoachId: id } }),
        transaction.customerPackage.count({ where: { coachId: id } }),
        transaction.customerPackageService.count({ where: { coachId: id } }),
      ]);

      if (relationCounts.some((count) => count > 0)) {
        throw new CoachRecordError("coach-delete-blocked");
      }

      await transaction.coach.delete({ where: { id } });
      await writeAuditLog(transaction, {
        actionType: "COACH_EDIT",
        actorId: user.id,
        description: `Permanently deleted archived coach: ${existing.firstName} ${existing.lastName}.`,
        oldValue: existing,
        targetId: existing.id,
        targetType: "Coach",
      });
    });
  } catch (error) {
    const errorCode =
      error instanceof CoachRecordError ? error.code : "delete-unavailable";

    redirect(coachPath(errorCode, true, "archived"));
  }

  revalidateCoachPages();
  redirect(coachPath("deleted", false, "archived"));
}
