import { AdminExpandableCard } from "../../../components/admin/admin-expandable-card";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { db } from "../../../lib/db";
import {
  createPackageCategoryAction,
  deleteOrArchivePackageCategoryAction,
  reorderPackageCategoriesAction,
  setPackageCategoryVisibilityAction,
  updatePackageCategoryAction,
} from "./actions";

type CategoriesPageProps = {
  searchParams: Promise<{
    category?: string;
    error?: string;
    field?: string;
    status?: string;
  }>;
};

type CategoryValue = {
  _count: { coaches: number; packages: number };
  description: string | null;
  id: string;
  isArchived: boolean;
  isPublic: boolean;
  name: string;
  slug: string;
  sortOrder: number;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

const errorMessages: Record<string, string> = {
  "archive-unavailable": "The category could not be archived or restored.",
  "delete-unavailable":
    "Only archived categories with no package or coach assignments can be deleted.",
  "duplicate-category": "A category with that name or slug already exists.",
  "duplicate-name": "A category with that name already exists.",
  "duplicate-slug": "A category with that slug already exists.",
  "invalid-category-action": "That category action is not valid.",
  "invalid-description": "Description must be 1,000 characters or fewer.",
  "invalid-name": "Category name is required and must be 120 characters or fewer.",
  "invalid-order": "Display order must be a non-negative whole number.",
  "invalid-slug":
    "Slug must contain letters or numbers separated by single hyphens.",
  "invalid-visibility": "The visibility value is not valid.",
  "not-found": "The selected category was not found.",
  "order-unavailable": "The category cannot be moved in that direction.",
  unavailable: "The category could not be saved. Please try again.",
  "visibility-unavailable":
    "Visibility could not be changed. Restore archived categories first.",
};

const statusMessages: Record<string, string> = {
  archived: "Category archived and hidden from public use.",
  created: "Category created.",
  deleted: "Archived category permanently deleted.",
  reordered: "Category order updated.",
  restored: "Category restored. Public visibility remains under Admin control.",
  updated: "Category updated.",
  "visibility-updated": "Category visibility updated.",
};

function FieldError({
  error,
  field,
  name,
}: {
  error?: string;
  field?: string;
  name: string;
}) {
  if (!error || field !== name) {
    return null;
  }

  return (
    <span className="mt-2 block text-sm font-semibold text-button-danger" role="alert">
      {errorMessages[error] ?? "Check this value and try again."}
    </span>
  );
}

function CategoryFields({
  category,
  error,
  field,
}: {
  category?: CategoryValue;
  error?: string;
  field?: string;
}) {
  return (
    <>
      {category ? <input name="id" type="hidden" value={category.id} /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <label className={labelClass}>
          Name
          <input
            className={inputClass}
            defaultValue={category?.name ?? ""}
            maxLength={120}
            name="name"
            required
          />
          <FieldError error={error} field={field} name="name" />
        </label>
        <label className={labelClass}>
          Slug
          <input
            className={inputClass}
            defaultValue={category?.slug ?? ""}
            maxLength={160}
            name="slug"
            placeholder="Generated from name when left blank"
          />
          <FieldError error={error} field={field} name="slug" />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Description
          <textarea
            className={`${inputClass} min-h-24`}
            defaultValue={category?.description ?? ""}
            maxLength={1000}
            name="description"
          />
          <FieldError error={error} field={field} name="description" />
        </label>
        <label className={labelClass}>
          Display order
          <input
            className={inputClass}
            defaultValue={category?.sortOrder ?? ""}
            min={0}
            name="sortOrder"
            placeholder={category ? undefined : "Added last when empty"}
            required={Boolean(category)}
            step={1}
            type="number"
          />
          <span className="mt-2 block text-xs font-normal text-secondary">
            Zero is first. Move buttons provide quick adjustments.
          </span>
          <FieldError error={error} field={field} name="sortOrder" />
        </label>
        {!category ? (
          <label className="flex min-h-11 items-center gap-3 self-end rounded-lg bg-neutral px-4 py-3 text-sm font-semibold text-foreground">
            <input defaultChecked name="isPublic" type="checkbox" />
            Publicly visible when category filtering launches
          </label>
        ) : null}
      </div>
    </>
  );
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const [categories, params] = await Promise.all([
    db.category.findMany({
      include: {
        _count: { select: { coaches: true, packages: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    }),
    searchParams,
  ]);
  const selectedCategoryId = params.category;
  const topError = params.error ? errorMessages[params.error] : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Package categories
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Manage package grouping
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Prepare category names, visibility, and display order. Package
          assignment and public filtering remain disabled until Phase 33.
        </p>
      </header>

      {statusMessage ? (
        <p className="mt-6 rounded-xl border border-status-low bg-card px-4 py-3 text-sm font-semibold text-foreground">
          {statusMessage}
        </p>
      ) : null}
      {topError ? (
        <p
          className="mt-6 rounded-xl border border-status-high bg-card px-4 py-3 text-sm font-semibold text-foreground"
          role="alert"
        >
          {topError}
        </p>
      ) : null}

      <Card className="mt-8">
        <h3 className="text-xl font-bold text-foreground">Create category</h3>
        <p className="mt-2 text-sm text-secondary">
          Slugs are normalized for stable future package-filter URLs.
        </p>
        <form action={createPackageCategoryAction} className="mt-5">
          <CategoryFields
            error={selectedCategoryId ? undefined : params.error}
            field={selectedCategoryId ? undefined : params.field}
          />
          <Button className="mt-5" pendingLabel="Creating..." type="submit">
            Create category
          </Button>
        </form>
      </Card>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Existing categories
            </h3>
            <p className="mt-1 text-sm text-secondary">
              Hidden and archived categories remain visible here for Admin.
            </p>
          </div>
          <p className="text-sm font-semibold text-secondary">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}
          </p>
        </div>

        {categories.length ? (
          <div className="mt-5 space-y-4">
            {categories.map((category, index) => {
              const isSelected = selectedCategoryId === category.id;

              return (
                <div id={`category-${category.id}`} key={category.id}>
                  <AdminExpandableCard
                    className={category.isArchived ? "opacity-80" : ""}
                    defaultOpen={isSelected}
                    summary={
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="break-words text-lg font-bold text-foreground">
                              {category.name}
                            </h4>
                            <p className="mt-1 break-all text-sm font-semibold text-brand">
                              {category.slug}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
                              Order {category.sortOrder}
                            </span>
                            <span className="rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
                              {category._count.packages} package
                              {category._count.packages === 1 ? "" : "s"}
                            </span>
                            <span className="rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
                              {category._count.coaches} coach
                              {category._count.coaches === 1 ? "" : "es"}
                            </span>
                            <span className="rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
                              {category.isPublic ? "Public" : "Hidden"}
                            </span>
                            {category.isArchived ? (
                              <span className="rounded-full bg-neutral px-3 py-1 text-xs font-semibold text-secondary">
                                Archived
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-secondary">
                          {category.description || "No description provided."}
                        </p>
                      </div>
                    }
                  >
                    {isSelected && topError ? (
                      <p
                        className="mb-5 rounded-xl border border-status-high bg-card px-4 py-3 text-sm font-semibold text-foreground"
                        role="alert"
                      >
                        {topError}
                      </p>
                    ) : null}

                    <form action={updatePackageCategoryAction}>
                      <CategoryFields
                        category={category}
                        error={isSelected ? params.error : undefined}
                        field={isSelected ? params.field : undefined}
                      />
                      <Button
                        className="mt-5"
                        pendingLabel="Saving..."
                        type="submit"
                      >
                        Save category
                      </Button>
                    </form>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
                      <form action={reorderPackageCategoriesAction}>
                        <input name="id" type="hidden" value={category.id} />
                        <input name="direction" type="hidden" value="up" />
                        <Button
                          disabled={index === 0}
                          pendingLabel="Moving..."
                          type="submit"
                          variant="neutral"
                        >
                          Move up
                        </Button>
                      </form>
                      <form action={reorderPackageCategoriesAction}>
                        <input name="id" type="hidden" value={category.id} />
                        <input name="direction" type="hidden" value="down" />
                        <Button
                          disabled={index === categories.length - 1}
                          pendingLabel="Moving..."
                          type="submit"
                          variant="neutral"
                        >
                          Move down
                        </Button>
                      </form>
                      <form action={setPackageCategoryVisibilityAction}>
                        <input name="id" type="hidden" value={category.id} />
                        <input
                          name="isPublic"
                          type="hidden"
                          value={category.isPublic ? "false" : "true"}
                        />
                        <Button
                          disabled={category.isArchived && !category.isPublic}
                          pendingLabel="Saving..."
                          type="submit"
                          variant="neutral"
                        >
                          {category.isPublic ? "Hide publicly" : "Make public"}
                        </Button>
                      </form>
                      <form action={deleteOrArchivePackageCategoryAction}>
                        <input name="id" type="hidden" value={category.id} />
                        <input
                          name="operation"
                          type="hidden"
                          value={category.isArchived ? "restore" : "archive"}
                        />
                        <Button
                          pendingLabel={
                            category.isArchived ? "Restoring..." : "Archiving..."
                          }
                          type="submit"
                          variant={category.isArchived ? "success" : "warning"}
                        >
                          {category.isArchived ? "Restore" : "Archive"}
                        </Button>
                      </form>
                      {category.isArchived ? (
                        <form action={deleteOrArchivePackageCategoryAction}>
                          <input name="id" type="hidden" value={category.id} />
                          <input name="operation" type="hidden" value="delete" />
                          <Button
                            disabled={
                              category._count.packages + category._count.coaches >
                              0
                            }
                            pendingLabel="Deleting..."
                            type="submit"
                            variant="danger"
                          >
                            Delete permanently
                          </Button>
                        </form>
                      ) : null}
                    </div>
                    {category.isArchived &&
                    category._count.packages + category._count.coaches > 0 ? (
                      <p className="mt-3 text-sm font-semibold text-secondary">
                        This category has package or coach assignments and
                        cannot be permanently deleted.
                      </p>
                    ) : null}
                  </AdminExpandableCard>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
            No package categories have been created yet.
          </p>
        )}
      </section>
    </>
  );
}
