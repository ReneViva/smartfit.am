"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { savePackageAction } from "../../app/admin/packages/actions";
import {
  CUSTOM_PACKAGE_TYPE_VALUE,
  PACKAGE_TYPE_PRESETS,
  packageTypeKey,
  packageTypeLabel,
} from "../../lib/package-types";
import { MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE } from "../../lib/package-freezes";
import { Button } from "../ui/button";

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none transition-[border-color,box-shadow] duration-200 focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

export type AdminPackageCoach = {
  firstName: string;
  id: string;
  isActive: boolean;
  lastName: string;
};

export type AdminPackageCategory = {
  id: string;
  isArchived?: boolean;
  isPublic: boolean;
  name: string;
  slug: string;
};

export type AdminPackageValue = {
  allowedEndTime: string | null;
  allowedStartTime: string | null;
  assignedCoach: {
    firstName: string;
    lastName: string;
  } | null;
  assignedCoachId: string | null;
  categories: AdminPackageCategory[];
  createdAt: string;
  defaultFreezeChances: number;
  defaultGuestPasses: number;
  description: string | null;
  discountPrice: string | null;
  hasTimeRestriction: boolean;
  highlightOnPublicPackages: boolean;
  id: string;
  isActive: boolean;
  name: string;
  packageType: string;
  price: string;
  sessionCount: number;
  timeRestrictionLabel: string | null;
};

type PackageFilter =
  | "all"
  | "active"
  | "inactive"
  | "all-day"
  | "daytime"
  | "individual"
  | "couple"
  | "time-restricted"
  | "unrestricted";

type PackageSort =
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "sessions-asc"
  | "sessions-desc"
  | "newest"
  | "oldest";

const filterOptions: Array<{ label: string; value: PackageFilter }> = [
  { label: "All packages", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "All-Day", value: "all-day" },
  { label: "Daytime", value: "daytime" },
  { label: "Individual", value: "individual" },
  { label: "Couple", value: "couple" },
  { label: "Time restricted", value: "time-restricted" },
  { label: "No time restriction", value: "unrestricted" },
];

function packageText(gymPackage: AdminPackageValue) {
  return [
    gymPackage.name,
    gymPackage.packageType,
    gymPackage.description,
    ...gymPackage.categories.map((category) => category.name),
    gymPackage.defaultGuestPasses > 0
      ? `${gymPackage.defaultGuestPasses} guest passes`
      : "no guest passes",
    gymPackage.discountPrice
      ? `discount price ${gymPackage.discountPrice}`
      : "no discount",
    gymPackage.highlightOnPublicPackages ? "featured highlighted public" : null,
    `${gymPackage.defaultFreezeChances} freeze chances`,
    gymPackage.timeRestrictionLabel,
    gymPackage.assignedCoach
      ? `${gymPackage.assignedCoach.firstName} ${gymPackage.assignedCoach.lastName}`
      : null,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replaceAll(/[-_—]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function searchTerms(query: string) {
  const normalized = query
    .toLowerCase()
    .replaceAll(/[-_—]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();

  if (normalized === "monthly") {
    return ["monthly", "1 month"];
  }

  if (normalized === "yearly" || normalized === "annual") {
    return [normalized, "12 month"];
  }

  return [normalized];
}

function matchesFilter(
  gymPackage: AdminPackageValue,
  filter: PackageFilter,
) {
  const text = packageText(gymPackage);

  switch (filter) {
    case "active":
      return gymPackage.isActive;
    case "inactive":
      return !gymPackage.isActive;
    case "all-day":
      return (
        !gymPackage.hasTimeRestriction ||
        text.includes("all day")
      );
    case "daytime":
      return text.includes("daytime") || text.includes("day time");
    case "individual":
      return text.includes("individual");
    case "couple":
      return text.includes("couple");
    case "time-restricted":
      return gymPackage.hasTimeRestriction;
    case "unrestricted":
      return !gymPackage.hasTimeRestriction;
    default:
      return true;
  }
}

function packageBadges(gymPackage: AdminPackageValue) {
  const text = packageText(gymPackage);
  const badges: string[] = [];

  badges.push(gymPackage.hasTimeRestriction ? "Time restricted" : "All-day access");

  if (text.includes("daytime") || text.includes("day time")) {
    badges.push("Daytime");
  }

  if (text.includes("couple")) {
    badges.push("Couple");
  } else if (text.includes("individual")) {
    badges.push("Individual");
  }

  if (text.includes("personal") && text.includes("training")) {
    badges.push("Personal training");
  } else if (text.includes("group") && text.includes("training")) {
    badges.push("Group training");
  } else if (text.includes("training")) {
    badges.push("Training");
  }

  return badges.slice(0, 3);
}

function displayPrice(value: string) {
  const price = Number(value);

  return Number.isFinite(price)
    ? new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }).format(price)
    : value;
}

function PackageFormFields({
  categories,
  categoryError = false,
  coaches,
  gymPackage,
}: {
  categories: AdminPackageCategory[];
  categoryError?: boolean;
  coaches: AdminPackageCoach[];
  gymPackage?: AdminPackageValue;
}) {
  const [hasTimeRestriction, setHasTimeRestriction] = useState(
    gymPackage?.hasTimeRestriction ?? false,
  );
  const existingPreset = PACKAGE_TYPE_PRESETS.find(
    (option) => option.value === gymPackage?.packageType,
  );
  const [packageTypeMode, setPackageTypeMode] = useState(
    existingPreset?.value ??
      (gymPackage?.packageType ? CUSTOM_PACKAGE_TYPE_VALUE : "GYM_ACCESS"),
  );
  const [customPackageType, setCustomPackageType] = useState(
    existingPreset ? "" : (gymPackage?.packageType ?? ""),
  );
  const assignedCategoryIds = new Set(
    gymPackage?.categories
      .filter((category) => !category.isArchived)
      .map((category) => category.id) ?? [],
  );
  const archivedCategories =
    gymPackage?.categories.filter((category) => category.isArchived) ?? [];

  return (
    <>
      {gymPackage ? <input name="id" type="hidden" value={gymPackage.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className={labelClass}>
          Name
          <input
            className={inputClass}
            defaultValue={gymPackage?.name ?? ""}
            maxLength={200}
            name="name"
            required
          />
        </label>
        <label className={labelClass}>
          Original price
          <input
            className={inputClass}
            defaultValue={gymPackage?.price ?? ""}
            min={0}
            name="price"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className={labelClass}>
          Discount price
          <input
            className={inputClass}
            defaultValue={gymPackage?.discountPrice ?? ""}
            min={0.01}
            name="discountPrice"
            step="0.01"
            type="number"
          />
          <span className="mt-1 block text-xs font-normal text-secondary">
            Final discounted price shown publicly. Leave empty for no discount.
          </span>
        </label>
        <label className={labelClass}>
          Session count
          <input
            className={inputClass}
            defaultValue={gymPackage?.sessionCount ?? ""}
            min={0}
            name="sessionCount"
            required
            step={1}
            type="number"
          />
        </label>
        <label className={labelClass}>
          Included guest passes
          <input
            className={inputClass}
            defaultValue={gymPackage?.defaultGuestPasses ?? 0}
            min={0}
            name="defaultGuestPasses"
            required
            step={1}
            type="number"
          />
        </label>
        <label className={labelClass}>
          Default freeze chances
          <input
            className={inputClass}
            defaultValue={gymPackage?.defaultFreezeChances ?? 3}
            max={MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE}
            min={0}
            name="defaultFreezeChances"
            required
            step={1}
            type="number"
          />
          <span className="mt-1 block text-xs font-normal text-secondary">
            Max {MAX_FREEZE_COUNT_PER_CUSTOMER_PACKAGE} per assigned package.
          </span>
        </label>
        <label className={labelClass}>
          Assigned coach
          <select
            className={inputClass}
            defaultValue={gymPackage?.assignedCoachId ?? ""}
            name="assignedCoachId"
          >
            <option value="">No assigned coach</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.firstName} {coach.lastName}
                {coach.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} md:col-span-2 xl:col-span-3`}>
          Description
          <textarea
            className={`${inputClass} min-h-24`}
            defaultValue={gymPackage?.description ?? ""}
            maxLength={2000}
            name="description"
          />
        </label>
      </div>

      <fieldset className="mt-4 rounded-xl border border-border bg-page p-4">
        <legend className="px-2 text-sm font-bold text-foreground">
          Package categories
        </legend>
        {categories.length ? (
          <>
            <p className="text-sm text-secondary">
              Select one or more categories. Hidden categories remain available
              to Admin but hide assigned packages from the public page.
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
            No active categories exist yet. Package saves remain available for
            compatibility, but create categories before enabling public
            category filtering.{" "}
            <Link
              className="text-brand hover:text-primary-hover"
              href="/admin/categories"
            >
              Manage categories
            </Link>
          </p>
        )}
        {categoryError ? (
          <p className="mt-3 text-sm font-semibold text-button-danger" role="alert">
            Select at least one available category before saving.
          </p>
        ) : null}
        {archivedCategories.length ? (
          <p className="mt-3 text-sm font-semibold text-secondary">
            Archived assignment
            {archivedCategories.length === 1 ? "" : "s"}:{" "}
            {archivedCategories.map((category) => category.name).join(", ")}.
            Select active replacements before saving.
          </p>
        ) : null}
      </fieldset>

      <details
        className="mt-4 rounded-xl border border-border bg-page p-4"
        open={packageTypeMode === CUSTOM_PACKAGE_TYPE_VALUE || undefined}
      >
        <summary className="cursor-pointer list-none text-sm font-bold text-foreground">
          Advanced / internal details
        </summary>
        <p className="mt-3 text-sm leading-6 text-secondary">
          Categories control public filters. This type is kept for internal
          compatibility.
        </p>
        <label className={`${labelClass} mt-4`}>
          Internal package type
          <select
            className={inputClass}
            onChange={(event) => setPackageTypeMode(event.target.value)}
            value={packageTypeMode}
          >
            {PACKAGE_TYPE_PRESETS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value={CUSTOM_PACKAGE_TYPE_VALUE}>Custom type</option>
          </select>
          {packageTypeMode === CUSTOM_PACKAGE_TYPE_VALUE ? (
            <input
              className={inputClass}
              maxLength={200}
              name="packageType"
              onChange={(event) => setCustomPackageType(event.target.value)}
              placeholder="Enter a custom internal package type"
              required
              value={customPackageType}
            />
          ) : (
            <input name="packageType" type="hidden" value={packageTypeMode} />
          )}
        </label>
      </details>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <label className="flex min-h-11 items-center gap-3 rounded-lg bg-neutral px-4 py-3 text-sm font-semibold text-foreground">
          <input
            defaultChecked={gymPackage?.isActive ?? true}
            name="isActive"
            type="checkbox"
          />
          Active and visible on the public packages page
        </label>
        <label className="flex min-h-11 items-start gap-3 rounded-lg bg-neutral px-4 py-3 text-sm font-semibold text-foreground">
          <input
            className="mt-1"
            defaultChecked={gymPackage?.highlightOnPublicPackages ?? false}
            name="highlightOnPublicPackages"
            type="checkbox"
          />
          <span>
            Highlight on public packages
            <span className="mt-1 block text-sm font-normal leading-6 text-secondary">
              Makes this package visually stand out on the public packages page.
            </span>
          </span>
        </label>
        <label className="flex min-h-11 items-center gap-3 rounded-lg bg-neutral px-4 py-3 text-sm font-semibold text-foreground">
          <input
            checked={hasTimeRestriction}
            name="hasTimeRestriction"
            onChange={(event) => setHasTimeRestriction(event.target.checked)}
            type="checkbox"
          />
          Use a simple time restriction
        </label>
      </div>

      {hasTimeRestriction ? (
        <div className="animate-panel-in mt-4 rounded-xl border border-border bg-page p-4">
          <p className="text-sm font-semibold text-foreground">
            Time restriction details
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              Allowed start time
              <input
                className={inputClass}
                defaultValue={gymPackage?.allowedStartTime ?? ""}
                name="allowedStartTime"
                type="time"
              />
            </label>
            <label className={labelClass}>
              Allowed end time
              <input
                className={inputClass}
                defaultValue={gymPackage?.allowedEndTime ?? ""}
                name="allowedEndTime"
                type="time"
              />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Public restriction label
              <input
                className={inputClass}
                defaultValue={gymPackage?.timeRestrictionLabel ?? ""}
                maxLength={500}
                name="timeRestrictionLabel"
                placeholder="Usable before 3:00 PM"
              />
            </label>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-border bg-page px-4 py-3 text-sm font-semibold text-secondary">
          All-day access. Enable a simple time restriction to show time fields.
        </p>
      )}
    </>
  );
}

export function AdminPackageManager({
  categories,
  categoryError = false,
  coaches,
  packages,
  selectedPackageId,
}: {
  categories: AdminPackageCategory[];
  categoryError?: boolean;
  coaches: AdminPackageCoach[];
  packages: AdminPackageValue[];
  selectedPackageId?: string;
}) {
  const [filter, setFilter] = useState<PackageFilter>("all");
  const [packageTypeFilter, setPackageTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PackageSort>("name-asc");
  const normalizedSearchTerms = useMemo(() => searchTerms(query), [query]);
  const packageTypeOptions = useMemo(
    () =>
      Array.from(new Set(packages.map((gymPackage) => gymPackage.packageType)))
        .sort((left, right) =>
          packageTypeLabel(left).localeCompare(packageTypeLabel(right)),
        ),
    [packages],
  );
  const visiblePackages = useMemo(() => {
    const filtered = packages.filter(
      (gymPackage) =>
        matchesFilter(gymPackage, filter) &&
        (packageTypeFilter === "all" ||
          packageTypeKey(gymPackage.packageType) ===
            packageTypeKey(packageTypeFilter)) &&
        (!normalizedSearchTerms[0] ||
          normalizedSearchTerms.some((term) =>
            packageText(gymPackage).includes(term),
          )),
    );

    return [...filtered].sort((left, right) => {
      switch (sort) {
        case "name-desc":
          return right.name.localeCompare(left.name);
        case "price-asc":
          return Number(left.price) - Number(right.price);
        case "price-desc":
          return Number(right.price) - Number(left.price);
        case "sessions-asc":
          return left.sessionCount - right.sessionCount;
        case "sessions-desc":
          return right.sessionCount - left.sessionCount;
        case "newest":
          return Date.parse(right.createdAt) - Date.parse(left.createdAt);
        case "oldest":
          return Date.parse(left.createdAt) - Date.parse(right.createdAt);
        default:
          return left.name.localeCompare(right.name);
      }
    });
  }, [filter, normalizedSearchTerms, packageTypeFilter, packages, sort]);

  return (
    <>
      <details className="smooth-panel mt-8 rounded-2xl border border-border bg-card shadow-sm">
        <summary className="min-h-14 cursor-pointer list-none rounded-2xl px-5 py-4 font-semibold text-foreground transition-colors hover:bg-soft-blue sm:px-6">
          <span className="flex flex-wrap items-center justify-between gap-3">
            <span>
              <span className="block text-lg font-bold">
                Create new package / service
              </span>
              <span className="mt-1 block text-sm font-normal text-secondary">
                Open create form
              </span>
            </span>
            <span className="rounded-lg bg-brand px-4 py-2 text-sm text-white">
              Create
            </span>
          </span>
        </summary>
        <form
          action={savePackageAction}
          className="animate-panel-in border-t border-border p-5 sm:p-6"
        >
          <PackageFormFields
            categories={categories}
            categoryError={categoryError && !selectedPackageId}
            coaches={coaches}
          />
          <Button className="mt-5 w-full sm:w-auto" type="submit">
            Create package
          </Button>
        </form>
      </details>

      <section className="mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Existing packages / services
            </h3>
            <p className="mt-1 text-sm text-secondary">
              Showing {visiblePackages.length} of {packages.length} packages.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur lg:sticky lg:top-3 lg:z-10">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_minmax(12rem,0.55fr)_minmax(12rem,0.45fr)_minmax(13rem,0.5fr)]">
            <label className={labelClass}>
              Search packages / services
              <input
                className={inputClass}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Swimming, cardio, coach, daytime..."
                type="search"
                value={query}
              />
            </label>
            <label className={labelClass}>
              Internal type
              <select
                className={inputClass}
                onChange={(event) => setPackageTypeFilter(event.target.value)}
                value={packageTypeFilter}
              >
                <option value="all">All types</option>
                {packageTypeOptions.map((packageType) => (
                  <option key={packageType} value={packageType}>
                    {packageTypeLabel(packageType)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Package filter
              <select
                className={inputClass}
                onChange={(event) =>
                  setFilter(event.target.value as PackageFilter)
                }
                value={filter}
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Sort
              <select
                className={inputClass}
                onChange={(event) => setSort(event.target.value as PackageSort)}
                value={sort}
              >
                <option value="name-asc">Name A to Z</option>
                <option value="name-desc">Name Z to A</option>
                <option value="price-asc">Price low to high</option>
                <option value="price-desc">Price high to low</option>
                <option value="sessions-asc">Sessions low to high</option>
                <option value="sessions-desc">Sessions high to low</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {filterOptions.slice(0, 9).map((option) => (
              <button
                className={`min-h-10 min-w-max rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                  filter === option.value
                    ? "border-brand bg-soft-blue text-primary-active"
                    : "border-border bg-card text-secondary hover:border-brand hover:text-primary-active"
                }`}
                key={option.value}
                onClick={() => setFilter(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {visiblePackages.length ? (
          <div className="mt-5 space-y-3">
            {visiblePackages.map((gymPackage) => (
              <details
                className="smooth-panel rounded-xl border border-border bg-card shadow-sm open:border-brand"
                id={`package-${gymPackage.id}`}
                key={gymPackage.id}
                open={selectedPackageId === gymPackage.id ? true : undefined}
              >
                <summary className="cursor-pointer list-none rounded-xl p-4 transition-colors hover:bg-soft-blue sm:p-5">
                  <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(14rem,1.2fr)_minmax(8rem,0.5fr)_minmax(8rem,0.5fr)_minmax(11rem,0.8fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-neutral px-3 py-1 text-xs font-bold text-secondary">
                        Internal: {packageTypeLabel(gymPackage.packageType)}
                      </span>
                      <h4 className="mt-1 break-words text-lg font-bold text-foreground">
                        {gymPackage.name}
                      </h4>
                    </div>
                    <p className="text-sm text-secondary">
                      <span className="block text-xs font-bold uppercase tracking-wide">
                        Original price
                      </span>
                      <span
                        className={`mt-1 block font-semibold ${
                          gymPackage.discountPrice
                            ? "text-secondary line-through"
                            : "text-foreground"
                        }`}
                      >
                        {displayPrice(gymPackage.price)}
                      </span>
                      {gymPackage.discountPrice ? (
                        <span className="mt-1 block font-bold text-brand">
                          {displayPrice(gymPackage.discountPrice)} discounted
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-secondary">
                      <span className="block text-xs font-bold uppercase tracking-wide">
                        Sessions
                      </span>
                      <span className="mt-1 block font-semibold text-foreground">
                        {gymPackage.sessionCount}
                      </span>
                    </p>
                    <p className="text-sm text-secondary">
                      <span className="block text-xs font-bold uppercase tracking-wide">
                        Coach
                      </span>
                      <span className="mt-1 block font-semibold text-foreground">
                        {gymPackage.assignedCoach
                          ? `${gymPackage.assignedCoach.firstName} ${gymPackage.assignedCoach.lastName}`
                          : "Not assigned"}
                      </span>
                    </p>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        gymPackage.isActive
                          ? "bg-soft-blue text-primary-active"
                          : "bg-neutral text-secondary"
                      }`}
                    >
                      {gymPackage.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    {gymPackage.highlightOnPublicPackages ? (
                      <span className="rounded-full border border-brand bg-soft-blue px-3 py-1 text-xs font-bold text-primary-active">
                        Featured publicly
                      </span>
                    ) : null}
                    {gymPackage.discountPrice ? (
                      <span className="rounded-full border border-status-low bg-card px-3 py-1 text-xs font-bold text-foreground">
                        Discount price: {displayPrice(gymPackage.discountPrice)}
                      </span>
                    ) : null}
                    {gymPackage.categories.length ? (
                      gymPackage.categories.map((category) => (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            category.isArchived || !category.isPublic
                              ? "border-border bg-neutral text-secondary"
                              : "border-brand bg-soft-blue text-primary-active"
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
                      ))
                    ) : (
                      <span className="rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
                        No categories assigned
                      </span>
                    )}
                    {packageBadges(gymPackage).map((badge) => (
                      <span
                        className="rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary"
                        key={badge}
                      >
                        {badge}
                      </span>
                    ))}
                    <span className="rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
                      {gymPackage.defaultGuestPasses > 0
                        ? `Includes ${gymPackage.defaultGuestPasses} guest ${gymPackage.defaultGuestPasses === 1 ? "pass" : "passes"}`
                        : "No guest passes"}
                    </span>
                    <span className="rounded-full border border-border bg-page px-3 py-1 text-xs font-semibold text-secondary">
                      {gymPackage.defaultFreezeChances} default freeze{" "}
                      {gymPackage.defaultFreezeChances === 1
                        ? "chance"
                        : "chances"}
                    </span>
                    {gymPackage.hasTimeRestriction &&
                    gymPackage.timeRestrictionLabel ? (
                      <span className="text-sm font-semibold text-primary-active">
                        {gymPackage.timeRestrictionLabel}
                      </span>
                    ) : null}
                    <span className="ml-auto text-sm font-semibold text-brand">
                      Open details / Edit
                    </span>
                  </div>
                </summary>
                <form
                  action={savePackageAction}
                  className="animate-panel-in border-t border-border p-4 sm:p-5"
                >
                  <PackageFormFields
                    categories={categories}
                    categoryError={
                      categoryError && selectedPackageId === gymPackage.id
                    }
                    coaches={coaches}
                    gymPackage={gymPackage}
                  />
                  <Button className="mt-5 w-full sm:w-auto" type="submit">
                    Save changes
                  </Button>
                </form>
              </details>
            ))}
          </div>
        ) : (
          <div className="animate-panel-in mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="font-semibold text-foreground">No packages found.</p>
            <p className="mt-2 text-sm text-secondary">
              Try another search term or package filter.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
