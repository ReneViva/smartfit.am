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

export async function saveCoachAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);
  const firstName = optionalText(formData, "firstName", 120);
  const lastName = optionalText(formData, "lastName", 120);
  const specialty = optionalText(formData, "specialty", 200);
  const rawPhotoUrl = optionalText(formData, "photoUrl", 1000);
  const photoUrl = optionalPublicUrl(formData, "photoUrl");

  if (!firstName || !lastName || !specialty) {
    redirect(`${COACHES_PATH}?error=invalid-required`);
  }

  const uploadedPhotoUrl = await uploadImageFromForm(
    formData,
    "photoUpload",
    { prefix: "coaches" },
  ).catch((error) => {
    redirect(`${COACHES_PATH}?error=upload-${imageUploadErrorCode(error)}`);
  });

  if (rawPhotoUrl && !photoUrl && !uploadedPhotoUrl) {
    redirect(`${COACHES_PATH}?error=invalid-url`);
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
          where: {
            deletedAt: null,
            id,
          },
        });

        if (!existing) {
          throw new Error("Coach not found.");
        }

        const saved = await transaction.coach.update({
          data,
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

      const saved = await transaction.coach.create({ data });

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
    redirect(`${COACHES_PATH}?error=unavailable`);
  }

  revalidatePath("/");
  revalidatePath("/coaches");
  revalidatePath("/packages");
  revalidatePath(COACHES_PATH);
  revalidatePath("/admin/packages");
  redirect(`${COACHES_PATH}?status=saved`);
}
