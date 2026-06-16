import Link from "next/link";

import { PublicLayout } from "../../components/layout/public-layout";
import { EmptyState } from "../../components/public/empty-state";
import { JsonLd } from "../../components/public/json-ld";
import { PageIntro } from "../../components/public/page-intro";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { packageTypeLabel } from "../../lib/package-types";
import {
  getPublicPackageCatalog,
  type PublicPackageSearchParams,
} from "../../lib/public-data";
import {
  createBreadcrumbJsonLd,
  createPublicMetadata,
} from "../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicMetadata({
  description:
    "Explore active Smartfit.am gym memberships, service packages, session options, and training plans.",
  path: "/packages",
  title: "Smartfit.am Packages — Gym Memberships, Services & Training Plans",
});

type PackagesPageProps = {
  searchParams: Promise<PublicPackageSearchParams>;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

export default async function PackagesPage({
  searchParams,
}: PackagesPageProps) {
  const catalog = await getPublicPackageCatalog(await searchParams);
  const hasFilters = Boolean(
    catalog.filters.category ||
      catalog.filters.minPrice ||
      catalog.filters.maxPrice ||
      catalog.filters.sort !== "name" ||
      catalog.filterErrors.length,
  );

  return (
    <PublicLayout>
      <JsonLd data={createBreadcrumbJsonLd("Packages", "/packages")} />

      <PageIntro
        description="Explore active Smartfit.am gym access, training, and service package options."
        eyebrow="Packages and services"
        title="Choose the way you want to move"
      />

      <div className="mt-10 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="mb-6 lg:sticky lg:top-6 lg:mb-0">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Filter packages
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  Find options by category and price.
                </p>
              </div>
              {hasFilters ? (
                <Link
                  className="text-sm font-semibold text-brand hover:text-primary-hover"
                  href="/packages"
                >
                  Clear
                </Link>
              ) : null}
            </div>

            <form className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <label className={labelClass}>
                Category
                <select
                  className={inputClass}
                  defaultValue={catalog.filters.category}
                  disabled={!catalog.categories.length}
                  name="category"
                >
                  <option value="">
                    {catalog.categories.length
                      ? "All categories"
                      : "No categories available"}
                  </option>
                  {catalog.categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Minimum price
                <input
                  className={inputClass}
                  defaultValue={catalog.filters.minPrice}
                  inputMode="decimal"
                  min={0}
                  name="minPrice"
                  placeholder="0"
                  step="0.01"
                  type="number"
                />
              </label>
              <label className={labelClass}>
                Maximum price
                <input
                  className={inputClass}
                  defaultValue={catalog.filters.maxPrice}
                  inputMode="decimal"
                  min={0}
                  name="maxPrice"
                  placeholder="Any"
                  step="0.01"
                  type="number"
                />
              </label>
              <label className={labelClass}>
                Sort
                <select
                  className={inputClass}
                  defaultValue={catalog.filters.sort}
                  name="sort"
                >
                  <option value="name">Name A to Z</option>
                  <option value="price-asc">Price low to high</option>
                  <option value="price-desc">Price high to low</option>
                </select>
              </label>
              <Button className="w-full sm:self-end" type="submit">
                Apply filters
              </Button>
            </form>
          </Card>
        </aside>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Available packages
              </h2>
              <p className="mt-1 text-sm text-secondary">
                {catalog.packages.length} matching package
                {catalog.packages.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          {catalog.filterErrors.length ? (
            <div
              className="mt-4 rounded-xl border border-status-high bg-card px-4 py-3 text-sm font-semibold text-foreground"
              role="alert"
            >
              {catalog.filterErrors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          ) : null}

          {catalog.packages.length ? (
            <div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {catalog.packages.map((gymPackage) => (
                <Card
                  className="public-interactive-card flex flex-col"
                  key={gymPackage.id}
                >
                  <div className="flex flex-wrap gap-2">
                    {gymPackage.categories.length ? (
                      gymPackage.categories.map((category) => (
                        <span
                          className="w-fit rounded-full bg-soft-blue px-3 py-1 text-sm font-semibold text-primary-active"
                          key={category.slug}
                        >
                          {category.name}
                        </span>
                      ))
                    ) : (
                      <span className="w-fit rounded-full bg-soft-blue px-3 py-1 text-sm font-semibold text-primary-active">
                        {packageTypeLabel(gymPackage.packageType)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-2xl font-bold text-foreground">
                    {gymPackage.name}
                  </h3>
                  <p className="mt-3 text-3xl font-bold text-foreground">
                    {gymPackage.price}
                  </p>
                  <p className="mt-1 text-sm text-secondary">
                    {gymPackage.sessionCount} sessions
                  </p>
                  {gymPackage.defaultGuestPasses > 0 ? (
                    <p className="mt-2 w-fit rounded-full bg-soft-blue px-3 py-1 text-sm font-semibold text-primary-active">
                      Includes {gymPackage.defaultGuestPasses} guest{" "}
                      {gymPackage.defaultGuestPasses === 1 ? "pass" : "passes"}
                    </p>
                  ) : null}
                  {gymPackage.description ? (
                    <p className="mt-4 text-sm leading-6 text-secondary">
                      {gymPackage.description}
                    </p>
                  ) : null}
                  <div className="mt-auto pt-5 text-sm text-secondary">
                    {gymPackage.assignedCoach ? (
                      <p>
                        Coach: {gymPackage.assignedCoach.firstName}{" "}
                        {gymPackage.assignedCoach.lastName}
                      </p>
                    ) : null}
                    {gymPackage.timeRestrictionLabel ? (
                      <p className="mt-2 rounded-lg bg-soft-blue px-3 py-2 text-primary-active">
                        {gymPackage.timeRestrictionLabel}
                      </p>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState>
                {catalog.available && hasFilters
                  ? "No packages match these filters."
                  : "Package information will be available soon."}
              </EmptyState>
            </div>
          )}
        </section>
      </div>
    </PublicLayout>
  );
}
