import Link from "next/link";

import { PublicLayout } from "../../components/layout/public-layout";
import { EmptyState } from "../../components/public/empty-state";
import { JsonLd } from "../../components/public/json-ld";
import { Button } from "../../components/ui/button";
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
const PACKAGE_HERO_IMAGE =
  "/images/victor-freitas-WvDYdXDzkhs-unsplash.jpg";

function formatAmd(value: string) {
  const price = Number(value);

  return Number.isFinite(price)
    ? `${new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
      }).format(price)} AMD`
    : `${value} AMD`;
}

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
    <PublicLayout fullWidth>
      <JsonLd data={createBreadcrumbJsonLd("Packages", "/packages")} />

      <section className="relative isolate overflow-hidden bg-black text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${PACKAGE_HERO_IMAGE}")` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-[#061521]/95"
        />
        <div className="relative mx-auto flex min-h-[24rem] w-full max-w-[90rem] flex-col items-center justify-center px-5 pb-16 pt-32 text-center sm:px-8 lg:pb-20 lg:pt-36">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">
            Packages and services
          </p>
          <h1 className="mt-3 max-w-5xl text-4xl font-bold text-white sm:text-7xl">
            Choose your training rhythm
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/85 sm:text-xl sm:leading-8">
            Compare active Smartfit.am access, training, and service options by
            public category, price, and routine.
          </p>
          {catalog.categories.length ? (
            <div className="mt-7 flex max-w-4xl flex-wrap justify-center gap-2">
              <Link
                className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                  catalog.filters.category
                    ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                    : "border-brand bg-brand text-white"
                }`}
                href="/packages"
              >
                All
              </Link>
              {catalog.categories.map((category) => (
                <Link
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                    catalog.filters.category === category.slug
                      ? "border-brand bg-brand text-white"
                      : "border-white/25 bg-white/10 text-white hover:bg-white/20"
                  }`}
                  href={`/packages?category=${encodeURIComponent(category.slug)}`}
                  key={category.slug}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto w-full max-w-[90rem] px-5 py-10 sm:px-8 sm:py-14">
        <section className="-mt-20 rounded-lg border border-border bg-card/95 p-5 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                Find your fit
              </p>
              <h2 className="mt-1 text-2xl font-bold text-foreground">
                Filter packages
              </h2>
              <p className="mt-1 text-sm text-secondary">
                Browse by public category, then refine by price and sorting.
              </p>
            </div>
            {hasFilters ? (
              <Link
                className="inline-flex min-h-10 items-center rounded-lg border border-border bg-page px-4 py-2 text-sm font-bold text-foreground hover:border-brand hover:text-brand"
                href="/packages"
              >
                Clear filters
              </Link>
            ) : null}
          </div>

          <form className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_minmax(11rem,0.5fr)_minmax(11rem,0.5fr)_minmax(12rem,0.5fr)_auto] xl:items-end">
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
            <Button
              className="w-full xl:min-w-36"
              pendingLabel="Applying..."
              type="submit"
            >
              Apply filters
            </Button>
          </form>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                Public catalog
              </p>
              <h2 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">
                Available packages
              </h2>
              <p className="mt-2 text-sm text-secondary">
                {catalog.packages.length} matching package
                {catalog.packages.length === 1 ? "" : "s"}.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-primary-hover"
              href="/contact"
            >
              Ask about membership
            </Link>
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
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {catalog.packages.map((gymPackage) => {
                const hasDiscount = Boolean(gymPackage.discountPrice);
                const ribbonLabel =
                  hasDiscount && gymPackage.discountRibbonPercent
                    ? `${gymPackage.discountRibbonPercent}%`
                    : null;

                return (
                  <article
                    className={`public-interactive-card group relative flex min-h-full flex-col overflow-hidden rounded-lg border shadow-sm ${
                      gymPackage.highlightOnPublicPackages
                        ? "border-brand/70 bg-soft-blue shadow-lg shadow-brand/10"
                        : "border-border bg-card"
                    }`}
                    key={gymPackage.id}
                  >
                    {gymPackage.highlightOnPublicPackages ? (
                      <div className="absolute right-3 top-3 z-10 rounded-full bg-brand px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-lg">
                        Featured
                      </div>
                    ) : null}
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#07111d]">
                      {ribbonLabel ? (
                        <div
                          aria-label={`Discount ${ribbonLabel}`}
                          className="absolute left-2 top-2 z-10 size-[clamp(4.25rem,18vw,5.375rem)] sm:left-3 sm:top-3"
                          role="img"
                        >
                          <img
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full rounded-full object-contain shadow-[0_10px_18px_rgba(0,0,0,0.34)]"
                            src="/logo/Ribbon.png"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute left-1/2 top-1/2 z-10 grid h-[42%] w-[58%] -translate-x-1/2 -translate-y-1/2 place-items-center text-center text-[clamp(0.75rem,2.6vw,1rem)] font-black leading-none text-[#102033] [text-shadow:0_1px_2px_rgb(255_255_255_/_0.76)]"
                          >
                            {ribbonLabel}
                          </span>
                        </div>
                      ) : null}
                      {gymPackage.imageUrl ? (
                        <img
                          alt={`${gymPackage.name} package image`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          src={gymPackage.imageUrl}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_25%,rgba(0,166,255,0.45),transparent_32%),linear-gradient(135deg,#061521,#0f1f2f_52%,#101826)] px-6 text-center">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/65">
                              Smartfit.am
                            </p>
                            <p className="mt-2 text-2xl font-black text-white">
                              Training Package
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex flex-wrap gap-2">
                        {gymPackage.categories.length ? (
                          gymPackage.categories.slice(0, 2).map((category) => (
                            <span
                              className="w-fit rounded-full bg-card px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-active ring-1 ring-brand/20"
                              key={category.slug}
                            >
                              {category.name}
                            </span>
                          ))
                        ) : (
                          <span className="w-fit rounded-full bg-neutral px-3 py-1 text-xs font-bold uppercase tracking-wide text-secondary">
                            Package option
                          </span>
                        )}
                      </div>

                      <h3 className="mt-5 text-2xl font-bold text-foreground">
                        {gymPackage.name}
                      </h3>
                      {gymPackage.description ? (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary">
                          {gymPackage.description}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-secondary">
                          Contact Smartfit.am for full package details.
                        </p>
                      )}

                      <div
                        className={`mt-6 rounded-lg border p-4 ${
                          hasDiscount
                            ? "border-status-low bg-card"
                            : "border-border bg-page"
                        }`}
                      >
                        <p className="text-sm font-semibold text-secondary">
                          {hasDiscount ? "Discount price" : "Starting price"}
                        </p>
                        {hasDiscount && gymPackage.discountPrice ? (
                          <>
                            <p className="mt-1 text-lg font-bold text-secondary line-through">
                              {formatAmd(gymPackage.price)}
                            </p>
                            <p className="mt-1 text-4xl font-bold text-brand">
                              {formatAmd(gymPackage.discountPrice)}
                            </p>
                            <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-status-low">
                              Final discounted price
                            </p>
                          </>
                        ) : (
                          <p className="mt-1 text-4xl font-bold text-foreground">
                            {formatAmd(gymPackage.price)}
                          </p>
                        )}
                      </div>

                      <Link
                        className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        href="/contact"
                      >
                        Ask about this package
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6">
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
