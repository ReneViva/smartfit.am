"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffRole } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { writeAuditLog } from "../../../lib/logging";
import {
  imageUploadErrorCode,
  uploadImageFromForm,
} from "../../../lib/uploads/cloudinary";

const GALLERY_PATH = "/admin/gallery";

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

function optionalSortOrder(formData: FormData) {
  const value = optionalText(formData, "sortOrder", 20);

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export async function saveGalleryImageAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);
  const rawImageUrl = optionalText(formData, "imageUrl", 1000);
  const imageUrl = optionalPublicUrl(formData, "imageUrl");
  const sortOrder = optionalSortOrder(formData);

  if (sortOrder === undefined) {
    redirect(`${GALLERY_PATH}?error=invalid-order`);
  }

  const uploadedImageUrl = await uploadImageFromForm(
    formData,
    "imageUpload",
  ).catch((error) => {
    redirect(`${GALLERY_PATH}?error=upload-${imageUploadErrorCode(error)}`);
  });

  if (rawImageUrl && !imageUrl && !uploadedImageUrl) {
    redirect(`${GALLERY_PATH}?error=invalid-url`);
  }

  if (!id && !imageUrl && !uploadedImageUrl) {
    redirect(`${GALLERY_PATH}?error=missing-image`);
  }

  try {
    await db.$transaction(async (transaction) => {
      const commonData = {
        altText: optionalText(formData, "altText", 300),
        isActive: formData.get("isActive") === "on",
        sortOrder,
        title: optionalText(formData, "title", 200),
      };

      if (id) {
        const existing = await transaction.galleryImage.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new Error("Gallery image not found.");
        }

        const saved = await transaction.galleryImage.update({
          data: {
            ...commonData,
            imageUrl: uploadedImageUrl ?? imageUrl ?? existing.imageUrl,
          },
          where: { id },
        });

        await writeAuditLog(transaction, {
          actionType: "PUBLIC_CONTENT_EDIT",
          actorId: user.id,
          description: `Updated gallery image: ${saved.title ?? saved.altText ?? saved.id}.`,
          newValue: saved,
          oldValue: existing,
          targetId: saved.id,
          targetType: "GalleryImage",
        });
        return;
      }

      const saved = await transaction.galleryImage.create({
        data: {
          ...commonData,
          imageUrl: uploadedImageUrl ?? imageUrl ?? "",
        },
      });

      await writeAuditLog(transaction, {
        actionType: "PUBLIC_CONTENT_EDIT",
        actorId: user.id,
        description: `Created gallery image: ${saved.title ?? saved.altText ?? saved.id}.`,
        newValue: saved,
        targetId: saved.id,
        targetType: "GalleryImage",
      });
    });
  } catch {
    redirect(`${GALLERY_PATH}?error=unavailable`);
  }

  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath(GALLERY_PATH);
  redirect(`${GALLERY_PATH}?status=saved`);
}

export async function deleteGalleryImageAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);

  if (!id) {
    redirect(`${GALLERY_PATH}?error=unavailable`);
  }

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.galleryImage.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Gallery image not found.");
      }

      await transaction.galleryImage.delete({ where: { id } });
      await writeAuditLog(transaction, {
        actionType: "PUBLIC_CONTENT_EDIT",
        actorId: user.id,
        description: `Deleted gallery image: ${existing.title ?? existing.altText ?? existing.id}.`,
        oldValue: existing,
        targetId: existing.id,
        targetType: "GalleryImage",
      });
    });
  } catch {
    redirect(`${GALLERY_PATH}?error=unavailable`);
  }

  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath(GALLERY_PATH);
  redirect(`${GALLERY_PATH}?status=deleted`);
}
