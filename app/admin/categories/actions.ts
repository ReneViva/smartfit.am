"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffRole } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { writeAuditLog } from "../../../lib/logging";

const CATEGORIES_PATH = "/admin/categories";
const MAX_SORT_ORDER = 100_000;
const SLUG_PATTERN =
  /^[\p{Letter}\p{Number}]+(?:-[\p{Letter}\p{Number}]+)*$/u;

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, name: string, maxLength: number) {
  const value = textValue(formData, name);
  return value && value.length <= maxLength ? value : null;
}

function categoryPath({
  categoryId,
  error,
  field,
  status,
}: {
  categoryId?: string;
  error?: string;
  field?: string;
  status?: string;
}) {
  const params = new URLSearchParams();

  if (categoryId) {
    params.set("category", categoryId);
  }
  if (error) {
    params.set("error", error);
  }
  if (field) {
    params.set("field", field);
  }
  if (status) {
    params.set("status", status);
  }

  const query = params.toString();
  return `${CATEGORIES_PATH}${query ? `?${query}` : ""}${
    categoryId ? `#category-${encodeURIComponent(categoryId)}` : ""
  }`;
}

function redirectError(
  error: string,
  options: { categoryId?: string; field?: string } = {},
): never {
  redirect(categoryPath({ error, ...options }));
}

function normalizedSlug(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function parsedSortOrder(formData: FormData, required: boolean) {
  const rawValue = textValue(formData, "sortOrder");

  if (!rawValue && !required) {
    return null;
  }

  const value = Number(rawValue);
  return Number.isInteger(value) && value >= 0 && value <= MAX_SORT_ORDER
    ? value
    : undefined;
}

async function duplicateCategory(
  name: string,
  slug: string,
  id?: string,
) {
  return db.category.findFirst({
    select: { name: true, slug: true },
    where: {
      AND: [
        id ? { id: { not: id } } : {},
        {
          OR: [
            { name: { equals: name, mode: "insensitive" } },
            { slug },
          ],
        },
      ],
    },
  });
}

async function normalizeOrder(
  transaction: Prisma.TransactionClient,
  orderedIds: string[],
) {
  await Promise.all(
    orderedIds.map((id, sortOrder) =>
      transaction.category.update({
        data: { sortOrder },
        where: { id },
      }),
    ),
  );
}

function validationValues(
  formData: FormData,
  requireOrder: boolean,
  categoryId?: string,
) {
  const name = optionalText(formData, "name", 120);
  const rawSlug = textValue(formData, "slug");
  const slug = normalizedSlug(rawSlug || name || "");
  const sortOrder = parsedSortOrder(formData, requireOrder);

  if (!name) {
    redirectError("invalid-name", { categoryId, field: "name" });
  }

  if (!slug || slug.length > 160 || !SLUG_PATTERN.test(slug)) {
    redirectError("invalid-slug", { categoryId, field: "slug" });
  }

  if (sortOrder === undefined) {
    redirectError("invalid-order", { categoryId, field: "sortOrder" });
  }

  const rawDescription = textValue(formData, "description");
  if (rawDescription.length > 1000) {
    redirectError("invalid-description", {
      categoryId,
      field: "description",
    });
  }

  return {
    description: rawDescription || null,
    name,
    slug,
    sortOrder,
  };
}

function revalidateCategories() {
  revalidatePath(CATEGORIES_PATH);
  revalidatePath("/admin/logs");
}

export async function createPackageCategoryAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const values = validationValues(formData, false);
  const duplicate = await duplicateCategory(values.name, values.slug);

  if (duplicate) {
    redirectError(
      duplicate.slug === values.slug ? "duplicate-slug" : "duplicate-name",
      { field: duplicate.slug === values.slug ? "slug" : "name" },
    );
  }

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      const insertionIndex = Math.min(
        values.sortOrder ?? existing.length,
        existing.length,
      );
      const saved = await transaction.category.create({
        data: {
          description: values.description,
          isPublic: formData.get("isPublic") === "on",
          name: values.name,
          slug: values.slug,
          sortOrder: insertionIndex,
        },
      });
      const orderedIds = existing.map((category) => category.id);
      orderedIds.splice(insertionIndex, 0, saved.id);
      await normalizeOrder(transaction, orderedIds);
      const finalCategory = await transaction.category.findUniqueOrThrow({
        where: { id: saved.id },
      });

      await writeAuditLog(transaction, {
        actionType: "CATEGORY_EDIT",
        actorId: user.id,
        description: `Created package category: ${saved.name}.`,
        newValue: finalCategory,
        targetId: saved.id,
        targetType: "Category",
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirectError("duplicate-category");
    }
    redirectError("unavailable");
  }

  revalidateCategories();
  redirect(categoryPath({ status: "created" }));
}

export async function updatePackageCategoryAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);

  if (!id) {
    redirectError("not-found");
  }

  const values = validationValues(formData, true, id);
  const duplicate = await duplicateCategory(values.name, values.slug, id);

  if (duplicate) {
    redirectError(
      duplicate.slug === values.slug ? "duplicate-slug" : "duplicate-name",
      {
        categoryId: id,
        field: duplicate.slug === values.slug ? "slug" : "name",
      },
    );
  }

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.category.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Category not found.");
      }

      await transaction.category.update({
        data: {
          description: values.description,
          name: values.name,
          slug: values.slug,
        },
        where: { id },
      });

      const categories = await transaction.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      const orderedIds = categories
        .map((category) => category.id)
        .filter((categoryId) => categoryId !== id);
      orderedIds.splice(
        Math.min(values.sortOrder ?? existing.sortOrder, orderedIds.length),
        0,
        id,
      );
      await normalizeOrder(transaction, orderedIds);

      const saved = await transaction.category.findUniqueOrThrow({
        where: { id },
      });
      await writeAuditLog(transaction, {
        actionType: "CATEGORY_EDIT",
        actorId: user.id,
        description: `Updated package category: ${saved.name}.`,
        newValue: saved,
        oldValue: existing,
        targetId: saved.id,
        targetType: "Category",
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirectError("duplicate-category", { categoryId: id });
    }
    redirectError("unavailable", { categoryId: id });
  }

  revalidateCategories();
  redirect(categoryPath({ categoryId: id, status: "updated" }));
}

export async function setPackageCategoryVisibilityAction(
  formData: FormData,
) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);
  const rawIsPublic = textValue(formData, "isPublic");

  if (!id || (rawIsPublic !== "true" && rawIsPublic !== "false")) {
    redirectError("invalid-visibility", { categoryId: id ?? undefined });
  }

  const isPublic = rawIsPublic === "true";

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.category.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Category not found.");
      }
      if (existing.isArchived && isPublic) {
        throw new Error("Archived categories cannot be public.");
      }

      const saved = await transaction.category.update({
        data: { isPublic },
        where: { id },
      });
      await writeAuditLog(transaction, {
        actionType: "CATEGORY_EDIT",
        actorId: user.id,
        description: `${isPublic ? "Made public" : "Hid"} package category: ${saved.name}.`,
        newValue: saved,
        oldValue: existing,
        targetId: saved.id,
        targetType: "Category",
      });
    });
  } catch {
    redirectError("visibility-unavailable", { categoryId: id });
  }

  revalidateCategories();
  redirect(categoryPath({ categoryId: id, status: "visibility-updated" }));
}

export async function reorderPackageCategoriesAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);
  const direction = textValue(formData, "direction");

  if (!id || (direction !== "up" && direction !== "down")) {
    redirectError("invalid-order", { categoryId: id ?? undefined });
  }

  try {
    await db.$transaction(async (transaction) => {
      const categories = await transaction.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      });
      const currentIndex = categories.findIndex((category) => category.id === id);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= categories.length
      ) {
        throw new Error("Category cannot be moved.");
      }

      const existing = categories[currentIndex];
      [categories[currentIndex], categories[targetIndex]] = [
        categories[targetIndex],
        categories[currentIndex],
      ];
      await normalizeOrder(
        transaction,
        categories.map((category) => category.id),
      );
      const saved = await transaction.category.findUniqueOrThrow({
        where: { id },
      });
      await writeAuditLog(transaction, {
        actionType: "CATEGORY_EDIT",
        actorId: user.id,
        description: `Moved package category ${saved.name} ${direction}.`,
        newValue: saved,
        oldValue: existing,
        targetId: saved.id,
        targetType: "Category",
      });
    });
  } catch {
    redirectError("order-unavailable", { categoryId: id });
  }

  revalidateCategories();
  redirect(categoryPath({ categoryId: id, status: "reordered" }));
}

export async function deleteOrArchivePackageCategoryAction(
  formData: FormData,
) {
  const user = await requireStaffRole("ADMIN");
  const id = optionalText(formData, "id", 100);
  const operation = textValue(formData, "operation");

  if (
    !id ||
    (operation !== "archive" &&
      operation !== "restore" &&
      operation !== "delete")
  ) {
    redirectError("invalid-category-action", {
      categoryId: id ?? undefined,
    });
  }

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.category.findUnique({
        include: {
          _count: { select: { coaches: true, packages: true } },
        },
        where: { id },
      });

      if (!existing) {
        throw new Error("Category not found.");
      }

      if (operation === "delete") {
        if (
          !existing.isArchived ||
          existing._count.packages + existing._count.coaches > 0
        ) {
          throw new Error("Category cannot be deleted.");
        }

        await transaction.category.delete({ where: { id } });
        await writeAuditLog(transaction, {
          actionType: "CATEGORY_EDIT",
          actorId: user.id,
          description: `Deleted archived package category: ${existing.name}.`,
          oldValue: existing,
          targetId: existing.id,
          targetType: "Category",
        });
        return;
      }

      const isArchived = operation === "archive";
      const saved = await transaction.category.update({
        data: {
          archivedAt: isArchived ? new Date() : null,
          isArchived,
          isPublic: isArchived ? false : existing.isPublic,
        },
        where: { id },
      });
      await writeAuditLog(transaction, {
        actionType: "CATEGORY_EDIT",
        actorId: user.id,
        description: `${isArchived ? "Archived" : "Restored"} package category: ${saved.name}.`,
        newValue: saved,
        oldValue: existing,
        targetId: saved.id,
        targetType: "Category",
      });
    });
  } catch {
    redirectError(
      operation === "delete" ? "delete-unavailable" : "archive-unavailable",
      { categoryId: id },
    );
  }

  revalidateCategories();
  redirect(
    categoryPath({
      categoryId: operation === "delete" ? undefined : id,
      status:
        operation === "delete"
          ? "deleted"
          : operation === "archive"
            ? "archived"
            : "restored",
    }),
  );
}
