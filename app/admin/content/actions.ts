"use server";

import { PublicContentType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffRole } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { writeAuditLog } from "../../../lib/logging";
import {
  imageUploadErrorCode,
  uploadImageFromForm,
} from "../../../lib/uploads/cloudinary";

const CONTENT_PATH = "/admin/content";
const contentTypes = new Set(Object.values(PublicContentType));

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

function optionalDate(formData: FormData, name: string) {
  const value = optionalText(formData, name, 100);

  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function savePublicContentAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);
  const title = optionalText(formData, "title", 200);
  const rawType = optionalText(formData, "type", 50);
  const startsAt = optionalDate(formData, "startsAt");
  const endsAt = optionalDate(formData, "endsAt");
  const rawImageUrl = optionalText(formData, "imageUrl", 1000);
  const imageUrl = optionalPublicUrl(formData, "imageUrl");

  if (!title || !rawType || !contentTypes.has(rawType as PublicContentType)) {
    redirect(`${CONTENT_PATH}?error=invalid-required`);
  }

  if (startsAt === undefined || endsAt === undefined) {
    redirect(`${CONTENT_PATH}?error=invalid-date`);
  }

  if (startsAt && endsAt && endsAt < startsAt) {
    redirect(`${CONTENT_PATH}?error=invalid-date-order`);
  }

  const uploadedImageUrl = await uploadImageFromForm(
    formData,
    "imageUpload",
  ).catch((error) => {
    redirect(`${CONTENT_PATH}?error=upload-${imageUploadErrorCode(error)}`);
  });

  if (rawImageUrl && !imageUrl && !uploadedImageUrl) {
    redirect(`${CONTENT_PATH}?error=invalid-url`);
  }

  const data = {
    body: optionalText(formData, "body", 5000),
    endsAt,
    imageUrl: uploadedImageUrl ?? imageUrl,
    isActive: formData.get("isActive") === "on",
    startsAt,
    title,
    type: rawType as PublicContentType,
  };

  try {
    await db.$transaction(async (transaction) => {
      if (id) {
        const existing = await transaction.publicContent.findFirst({
          where: {
            deletedAt: null,
            id,
          },
        });

        if (!existing) {
          throw new Error("Public content not found.");
        }

        const saved = await transaction.publicContent.update({
          data,
          where: { id },
        });

        await writeAuditLog(transaction, {
          actionType: "PUBLIC_CONTENT_EDIT",
          actorId: user.id,
          description: `Updated public content: ${saved.title}.`,
          newValue: saved,
          oldValue: existing,
          targetId: saved.id,
          targetType: "PublicContent",
        });
        return;
      }

      const saved = await transaction.publicContent.create({
        data: {
          ...data,
          createdById: user.id,
        },
      });

      await writeAuditLog(transaction, {
        actionType: "PUBLIC_CONTENT_EDIT",
        actorId: user.id,
        description: `Created public content: ${saved.title}.`,
        newValue: saved,
        targetId: saved.id,
        targetType: "PublicContent",
      });
    });
  } catch {
    redirect(`${CONTENT_PATH}?error=unavailable`);
  }

  revalidatePath("/");
  revalidatePath(CONTENT_PATH);
  redirect(`${CONTENT_PATH}?status=saved`);
}
