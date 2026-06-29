import Link from "next/link";

import { AdminExpandableCard } from "../../../components/admin/admin-expandable-card";
import { AdminRecordAction } from "../../../components/admin/admin-record-action";
import { ImageInput } from "../../../components/admin/image-input";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/ui/status-badge";
import { db } from "../../../lib/db";
import {
  archiveCoachAction,
  deleteCoachAction,
  restoreCoachAction,
  saveCoachAction,
} from "./actions";

type CoachesPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
    view?: string;
  }>;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

const errorMessages: Record<string, string> = {
  "archive-unavailable": "Coach could not be archived. Please try again.",
  "coach-delete-blocked":
    "Cannot permanently delete this coach because related records exist. Keep archived instead.",
  "delete-unavailable":
    "Archived coach could not be permanently deleted. Please try again.",
  "invalid-categories":
    "Selected categories must be active existing categories.",
  "invalid-record": "Choose a valid coach.",
  "invalid-required": "First name, last name, and specialty are required.",
  "invalid-url": "Photo URL must use a valid http or https URL.",
  "restore-unavailable": "Archived coach could not be restored. Please try again.",
  "upload-configuration":
    "Image upload storage is not configured. Add storage values to .env or use an image URL.",
  "upload-failed": "Image upload failed. Try again or use an image URL.",
  "upload-file-size": "Image files must be 5 MB or smaller.",
  "upload-file-type": "Choose a valid image file.",
  unavailable: "Coach could not be saved. Please try again.",
};

const statusMessages: Record<string, string> = {
  archived: "Coach archived.",
  deleted: "Archived coach permanently deleted.",
  restored: "Coach restored.",
  saved: "Coach saved.",
};

type CoachFormValue = {
  categories: { category: CoachCategoryValue }[];
  contactInfo: string | null;
  deletedAt?: Date | null;
  description: string | null;
  firstName: string;
  id: string;
  isActive: boolean;
  lastName: string;
  photoUrl: string | null;
  specialty: string;
};

type CoachCategoryValue = {
  id: string;
  isArchived: boolean;
  isPublic: boolean;
  name: string;
};

function CoachCategoryBadges({
  categories,
}: {
  categories: { category: CoachCategoryValue }[];
}) {
  if (!categories.length) {
    return (
      <span className="rounded-full border border-dashed border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
        No categories
      </span>
    );
  }

  return categories.map(({ category }) => (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        category.isArchived || !category.isPublic
          ? "border-border bg-page text-secondary"
          : "border-brand/25 bg-soft-blue text-brand"
      }`}
      key={category.id}
    >
      {category.name}
      {category.isArchived
        ? " (archived)"
        : !category.isPublic
          ? " (hidden)"
          : ""}
    </span>
  ));
}

function CoachFields({
  categories,
  coach,
}: {
  categories: CoachCategoryValue[];
  coach?: CoachFormValue;
}) {
  const assignedCategoryIds = new Set(
    coach?.categories
      .filter(({ category }) => !category.isArchived)
      .map(({ category }) => category.id) ?? [],
  );
  const archivedCategories =
    coach?.categories
      .filter(({ category }) => category.isArchived)
      .map(({ category }) => category) ?? [];

  return (
    <>
      {coach ? <input name="id" type="hidden" value={coach.id} /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <label className={labelClass}>
          First name
          <input
            className={inputClass}
            defaultValue={coach?.firstName ?? ""}
            maxLength={120}
            name="firstName"
            required
          />
        </label>
        <label className={labelClass}>
          Last name
          <input
            className={inputClass}
            defaultValue={coach?.lastName ?? ""}
            maxLength={120}
            name="lastName"
            required
          />
        </label>
        <label className={labelClass}>
          Specialty
          <input
            className={inputClass}
            defaultValue={coach?.specialty ?? ""}
            maxLength={200}
            name="specialty"
            required
          />
        </label>
        <ImageInput
          defaultValue={coach?.photoUrl ?? ""}
          label="Coach photo"
          name="photoUrl"
          uploadName="photoUpload"
        />
        <label className={`${labelClass} md:col-span-2`}>
          Description
          <textarea
            className={`${inputClass} min-h-28`}
            defaultValue={coach?.description ?? ""}
            maxLength={2000}
            name="description"
          />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Contact information
          <input
            className={inputClass}
            defaultValue={coach?.contactInfo ?? ""}
            maxLength={500}
            name="contactInfo"
          />
        </label>
      </div>
      <label className="mt-5 flex items-center gap-3 rounded-lg bg-neutral px-4 py-3 text-sm font-semibold text-foreground">
        <input defaultChecked={coach?.isActive ?? true} name="isActive" type="checkbox" />
        Active and visible on the public coaches page
      </label>
      <fieldset className="mt-5 rounded-xl border border-border bg-page p-4">
        <legend className="px-2 text-sm font-bold text-foreground">
          Coach categories
        </legend>
        {categories.length ? (
          <>
            <p className="text-sm text-secondary">
              Assign categories such as Gym, Swimming, Cardio, or Bodybuilding
              to help organize coaches.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <label
                  className="flex min-h-11 items-center gap-3 rounded-lg bg-card px-4 py-3 text-sm font-semibold text-foreground"
                  key={category.id}
                >
                  <input
                    defaultChecked={assignedCategoryIds.has(category.id)}
                    name="categoryIds"
                    type="checkbox"
                    value={category.id}
                  />
                  <span>
                    {category.name}
                    {!category.isPublic ? (
                      <span className="ml-2 text-xs text-secondary">
                        Hidden publicly
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm font-semibold text-secondary">
            No categories yet. Create categories from the Categories section
            first.{" "}
            <Link
              className="text-brand hover:text-primary-hover"
              href="/admin/categories"
            >
              Manage categories
            </Link>
          </p>
        )}
        {archivedCategories.length ? (
          <p className="mt-3 text-sm font-semibold text-secondary">
            Archived assignment
            {archivedCategories.length === 1 ? "" : "s"}:{" "}
            {archivedCategories.map((category) => category.name).join(", ")}.
            Select active replacements before saving.
          </p>
        ) : null}
      </fieldset>
    </>
  );
}

export default async function CoachesPage({ searchParams }: CoachesPageProps) {
  const params = await searchParams;
  const isArchivedView = params.view === "archived";
  const [coaches, categories, activeCount, archivedCount] = await Promise.all([
    db.coach.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        categories: {
          orderBy: {
            category: {
              sortOrder: "asc",
            },
          },
          select: {
            category: {
              select: {
                id: true,
                isArchived: true,
                isPublic: true,
                name: true,
              },
            },
          },
        },
        contactInfo: true,
        deletedAt: true,
        description: true,
        firstName: true,
        id: true,
        isActive: true,
        lastName: true,
        photoUrl: true,
        specialty: true,
      },
      where: isArchivedView ? { deletedAt: { not: null } } : { deletedAt: null },
    }),
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        isArchived: true,
        isPublic: true,
        name: true,
      },
      where: { isArchived: false },
    }),
    db.coach.count({ where: { deletedAt: null } }),
    db.coach.count({ where: { deletedAt: { not: null } } }),
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Coaches
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Manage coach profiles
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Create and update coach profiles. Only active coaches appear on the
          public website.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            isArchivedView
              ? "border-border bg-card text-secondary hover:border-brand hover:text-primary-active"
              : "border-brand bg-soft-blue text-primary-active"
          }`}
          href="/admin/coaches"
        >
          Active coaches ({activeCount})
        </Link>
        <Link
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            isArchivedView
              ? "border-brand bg-soft-blue text-primary-active"
              : "border-border bg-card text-secondary hover:border-brand hover:text-primary-active"
          }`}
          href="/admin/coaches?view=archived"
        >
          Archived coaches ({archivedCount})
        </Link>
      </div>

      {statusMessage ? (
        <p className="mt-6 rounded-xl border border-status-low bg-card px-4 py-3 text-sm font-semibold text-foreground">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p
          className="mt-6 rounded-xl border border-status-high bg-card px-4 py-3 text-sm font-semibold text-foreground"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {!isArchivedView ? (
        <Card className="mt-8">
          <h3 className="text-xl font-bold text-foreground">Create coach</h3>
          <form action={saveCoachAction} className="mt-5">
            <CoachFields categories={categories} />
            <Button className="mt-5" pendingLabel="Creating..." type="submit">
              Create coach
            </Button>
          </form>
        </Card>
      ) : null}

      <section className="mt-10">
        <h3 className="text-2xl font-bold text-foreground">
          {isArchivedView ? "Archived coaches" : "Existing coaches"}
        </h3>
        {coaches.length ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {coaches.map((coach) => (
              <AdminExpandableCard
                key={coach.id}
                summary={
                  <div className="flex min-w-0 gap-4 p-5">
                    <div className="size-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-soft-blue">
                      {coach.photoUrl ? (
                        <img
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
                          src={coach.photoUrl}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-lg font-bold text-primary-active">
                          {coach.firstName.charAt(0)}
                          {coach.lastName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="truncate text-lg font-bold text-foreground">
                            {coach.firstName} {coach.lastName}
                          </h4>
                          <p className="mt-1 truncate text-sm font-semibold text-brand">
                            {coach.specialty}
                          </p>
                        </div>
                        <StatusBadge
                          className="px-2.5 py-1 text-xs"
                          status={
                            isArchivedView
                              ? "medium"
                              : coach.isActive
                                ? "active"
                                : "notInGym"
                          }
                        >
                          {isArchivedView
                            ? "Archived"
                            : coach.isActive
                              ? "Active"
                              : "Inactive"}
                        </StatusBadge>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-secondary">
                        {coach.description || "No coach description provided."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <CoachCategoryBadges categories={coach.categories} />
                      </div>
                    </div>
                  </div>
                }
              >
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                    {isArchivedView ? "Archived coach" : "Editing coach"}
                  </p>
                  <h4 className="mt-1 text-lg font-bold text-foreground">
                    {coach.firstName} {coach.lastName}
                  </h4>
                </div>
                {isArchivedView ? (
                  <div className="rounded-xl border border-border bg-page p-4">
                    <p className="text-sm leading-6 text-secondary">
                      Restore this coach to edit the profile again. Permanent
                      delete is available only when no related records exist.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <AdminRecordAction
                        action={restoreCoachAction}
                        confirmMessage={`Restore coach ${coach.firstName} ${coach.lastName}?`}
                        fields={{ id: coach.id }}
                        pendingLabel="Restoring..."
                        variant="success"
                      >
                        Restore
                      </AdminRecordAction>
                      <AdminRecordAction
                        action={deleteCoachAction}
                        confirmMessage={`Permanently delete archived coach ${coach.firstName} ${coach.lastName}? This cannot be undone.`}
                        fields={{ id: coach.id }}
                        pendingLabel="Deleting..."
                        variant="danger"
                      >
                        Delete permanently
                      </AdminRecordAction>
                    </div>
                  </div>
                ) : (
                  <>
                    <form action={saveCoachAction}>
                      <CoachFields categories={categories} coach={coach} />
                      <Button
                        className="mt-5"
                        pendingLabel="Saving..."
                        type="submit"
                      >
                        Save changes
                      </Button>
                    </form>
                    <div className="mt-5 rounded-xl border border-status-medium bg-page p-4">
                      <p className="text-sm font-semibold text-foreground">
                        Archive coach
                      </p>
                      <p className="mt-1 text-sm leading-6 text-secondary">
                        Hides this coach from public pages and active admin
                        lists without removing related history.
                      </p>
                      <AdminRecordAction
                        action={archiveCoachAction}
                        className="mt-3"
                        confirmMessage={`Archive coach ${coach.firstName} ${coach.lastName}?`}
                        fields={{ id: coach.id }}
                        pendingLabel="Archiving..."
                        variant="danger"
                      >
                        Archive
                      </AdminRecordAction>
                    </div>
                  </>
                )}
              </AdminExpandableCard>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
            {isArchivedView
              ? "No coaches have been archived."
              : "No coaches have been created yet."}
          </p>
        )}
      </section>
    </>
  );
}
