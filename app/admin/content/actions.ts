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
} from "../../../lib/uploads/storage";

const CONTENT_PATH = "/admin/content";
const PUBLIC_INTERNAL_PATH_PATTERN = /^\/(?!\/)[^\s\\]*$/;
const contentTypes = new Set(Object.values(PublicContentType));

function contentPath(errorOrStatus: string, isError = true, view?: "archived") {
  const params = new URLSearchParams({
    [isError ? "error" : "status"]: errorOrStatus,
  });

  if (view) {
    params.set("view", view);
  }

  return `${CONTENT_PATH}?${params.toString()}`;
}

function revalidateContentPages() {
  revalidatePath("/");
  revalidatePath("/our-app");
  revalidatePath(CONTENT_PATH);
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

function optionalPublicHref(formData: FormData, name: string) {
  const value = optionalText(formData, name, 1000);

  if (!value) {
    return null;
  }

  if (PUBLIC_INTERNAL_PATH_PATTERN.test(value)) {
    return value;
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

function contentOrderBy() {
  return [
    { sortOrder: "asc" as const },
    { createdAt: "asc" as const },
    { id: "asc" as const },
  ];
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
  const rawCtaUrl = optionalText(formData, "ctaUrl", 1000);
  const ctaUrl = optionalPublicHref(formData, "ctaUrl");

  if (!title || !rawType || !contentTypes.has(rawType as PublicContentType)) {
    redirect(contentPath("invalid-required"));
  }

  if (startsAt === undefined || endsAt === undefined) {
    redirect(contentPath("invalid-date"));
  }

  if (startsAt && endsAt && endsAt < startsAt) {
    redirect(contentPath("invalid-date-order"));
  }

  const uploadedImageUrl = await uploadImageFromForm(
    formData,
    "imageUpload",
    { prefix: "public-content" },
  ).catch((error) => {
    redirect(contentPath(`upload-${imageUploadErrorCode(error)}`));
  });

  if (rawImageUrl && !imageUrl && !uploadedImageUrl) {
    redirect(contentPath("invalid-url"));
  }

  if (rawCtaUrl && !ctaUrl) {
    redirect(contentPath("invalid-url"));
  }

  const data = {
    body: optionalText(formData, "body", 5000),
    ctaLabel: optionalText(formData, "ctaLabel", 80),
    ctaUrl,
    endsAt,
    imageUrl: uploadedImageUrl ?? imageUrl,
    isActive: formData.get("isActive") === "on",
    startsAt,
    title,
    type: rawType as PublicContentType,
    visibleOnApp: formData.get("visibleOnApp") === "on",
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

      const maxOrder = await transaction.publicContent.aggregate({
        _max: { sortOrder: true },
        where: { deletedAt: null },
      });
      const saved = await transaction.publicContent.create({
        data: {
          ...data,
          createdById: user.id,
          sortOrder: (maxOrder._max.sortOrder ?? -10) + 10,
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
    redirect(contentPath("unavailable"));
  }

  revalidateContentPages();
  redirect(contentPath("saved", false));
}

export async function movePublicContentAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);
  const direction = optionalText(formData, "direction", 10);

  if (!id || (direction !== "up" && direction !== "down")) {
    redirect(contentPath("invalid-order"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const orderedContent = await transaction.publicContent.findMany({
        orderBy: contentOrderBy(),
        select: {
          id: true,
          sortOrder: true,
          title: true,
        },
        where: { deletedAt: null },
      });
      const currentIndex = orderedContent.findIndex((item) => item.id === id);

      if (currentIndex === -1) {
        throw new Error("Public content not found.");
      }

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= orderedContent.length) {
        return;
      }

      const reordered = [...orderedContent];
      [reordered[currentIndex], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[currentIndex],
      ];

      for (const [index, item] of reordered.entries()) {
        await transaction.publicContent.update({
          data: { sortOrder: index * 10 },
          where: { id: item.id },
        });
      }

      await writeAuditLog(transaction, {
        actionType: "PUBLIC_CONTENT_EDIT",
        actorId: user.id,
        description: `Moved public content ${direction}: ${
          orderedContent[currentIndex].title
        }.`,
        newValue: {
          order: reordered.map((item, index) => ({
            id: item.id,
            sortOrder: index * 10,
            title: item.title,
          })),
        },
        oldValue: {
          order: orderedContent.map((item) => ({
            id: item.id,
            sortOrder: item.sortOrder,
            title: item.title,
          })),
        },
        targetId: id,
        targetType: "PublicContent",
      });
    });
  } catch {
    redirect(contentPath("unavailable"));
  }

  revalidateContentPages();
  redirect(contentPath("saved", false));
}

export async function archivePublicContentAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);

  if (!id) {
    redirect(contentPath("invalid-record"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.publicContent.findFirst({
        where: { deletedAt: null, id },
      });

      if (!existing) {
        throw new Error("Public content not found.");
      }

      const deletedAt = new Date();
      const saved = await transaction.publicContent.update({
        data: { deletedAt },
        where: { id },
      });

      await writeAuditLog(transaction, {
        actionType: "PUBLIC_CONTENT_EDIT",
        actorId: user.id,
        description: `Archived public content: ${saved.title}.`,
        newValue: { deletedAt },
        oldValue: existing,
        targetId: saved.id,
        targetType: "PublicContent",
      });
    });
  } catch {
    redirect(contentPath("archive-unavailable"));
  }

  revalidateContentPages();
  redirect(contentPath("archived", false, "archived"));
}

export async function restorePublicContentAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);

  if (!id) {
    redirect(contentPath("invalid-record", true, "archived"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.publicContent.findFirst({
        where: { deletedAt: { not: null }, id },
      });

      if (!existing) {
        throw new Error("Public content not found.");
      }

      const saved = await transaction.publicContent.update({
        data: { deletedAt: null },
        where: { id },
      });

      await writeAuditLog(transaction, {
        actionType: "PUBLIC_CONTENT_EDIT",
        actorId: user.id,
        description: `Restored public content: ${saved.title}.`,
        newValue: { deletedAt: null },
        oldValue: existing,
        targetId: saved.id,
        targetType: "PublicContent",
      });
    });
  } catch {
    redirect(contentPath("restore-unavailable", true, "archived"));
  }

  revalidateContentPages();
  redirect(contentPath("restored", false));
}

export async function deletePublicContentAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);

  if (!id) {
    redirect(contentPath("invalid-record", true, "archived"));
  }

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.publicContent.findFirst({
        where: { deletedAt: { not: null }, id },
      });

      if (!existing) {
        throw new Error("Public content not found.");
      }

      await transaction.publicContent.delete({ where: { id } });
      await writeAuditLog(transaction, {
        actionType: "PUBLIC_CONTENT_EDIT",
        actorId: user.id,
        description: `Permanently deleted archived public content: ${existing.title}.`,
        oldValue: existing,
        targetId: existing.id,
        targetType: "PublicContent",
      });
    });
  } catch {
    redirect(contentPath("delete-unavailable", true, "archived"));
  }

  revalidateContentPages();
  redirect(contentPath("deleted", false, "archived"));
}
