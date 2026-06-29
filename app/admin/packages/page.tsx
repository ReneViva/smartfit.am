import { AdminPackageManager } from "../../../components/admin/admin-package-manager";
import { db } from "../../../lib/db";
import Link from "next/link";

type PackagesPageProps = {
  searchParams: Promise<{
    error?: string;
    package?: string;
    status?: string;
    view?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "archive-unavailable": "Package could not be archived. Please try again.",
  "delete-unavailable":
    "Archived package could not be permanently deleted. Please try again.",
  "incomplete-restriction":
    "A restricted package needs an end time or a useful restriction label.",
  "invalid-coach": "The selected coach is not available.",
  "invalid-categories":
    "Select at least one available category. Archived or unknown categories cannot be assigned.",
  "invalid-discount-price":
    "Discount price must be a positive number lower than the original price.",
  "invalid-discount-ribbon":
    "Discount ribbon percentage must be a whole number from 1 to 99.",
  "invalid-freeze-chances":
    "Default freeze chances must be a whole number from 0 to 3.",
  "invalid-guest-passes":
    "Default guest passes must be a non-negative whole number.",
  "invalid-price":
    "Price must be a non-negative number with no more than two decimal places.",
  "invalid-required":
    "Name, original price, and package/service type are required.",
  "invalid-record": "Choose a valid package.",
  "invalid-sessions": "Session count must be a non-negative whole number.",
  "invalid-time": "Time values must use a valid 24-hour time.",
  "invalid-time-order": "Start time must be earlier than end time.",
  "invalid-url": "Image URLs must use http or https.",
  "package-delete-blocked":
    "Cannot permanently delete this package because related records exist. Keep archived instead.",
  "restore-unavailable":
    "Archived package could not be restored. Please try again.",
  unavailable: "Package could not be saved. Please try again.",
  "upload-configuration":
    "Image upload storage is not configured. Add storage values to .env or use an image URL.",
  "upload-failed": "Image upload failed. Try again or use an image URL.",
  "upload-file-size": "Image files must be 5 MB or smaller.",
  "upload-file-type": "Choose a valid image file.",
};

const statusMessages: Record<string, string> = {
  archived: "Package archived.",
  deleted: "Archived package permanently deleted.",
  restored: "Package restored.",
  saved: "Package saved.",
};

export default async function PackagesPage({ searchParams }: PackagesPageProps) {
  const params = await searchParams;
  const isArchivedView = params.view === "archived";
  const [packages, coaches, categories, activeCount, archivedCount] = await Promise.all([
    db.package.findMany({
      orderBy: { name: "asc" },
      select: {
        allowedEndTime: true,
        allowedStartTime: true,
        assignedCoach: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        assignedCoachId: true,
        categories: {
          select: {
            category: {
              select: {
                id: true,
                isArchived: true,
                isPublic: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        createdAt: true,
        deletedAt: true,
        defaultFreezeChances: true,
        defaultGuestPasses: true,
        description: true,
        discountPrice: true,
        discountRibbonPercent: true,
        hasTimeRestriction: true,
        highlightOnPublicPackages: true,
        id: true,
        imageUrl: true,
        isActive: true,
        name: true,
        packageType: true,
        price: true,
        sessionCount: true,
        timeRestrictionLabel: true,
      },
      where: isArchivedView ? { deletedAt: { not: null } } : { deletedAt: null },
    }),
    db.coach.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        firstName: true,
        id: true,
        isActive: true,
        lastName: true,
      },
      where: { deletedAt: null },
    }),
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        isPublic: true,
        name: true,
        slug: true,
      },
      where: { isArchived: false },
    }),
    db.package.count({ where: { deletedAt: null } }),
    db.package.count({ where: { deletedAt: { not: null } } }),
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage = params.status ? statusMessages[params.status] : null;
  const packageValues = packages.map((gymPackage) => ({
    ...gymPackage,
    categories: gymPackage.categories.map(({ category }) => category),
    createdAt: gymPackage.createdAt.toISOString(),
    deletedAt: gymPackage.deletedAt?.toISOString() ?? null,
    discountPrice: gymPackage.discountPrice?.toString() ?? null,
    price: gymPackage.price.toString(),
  }));

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Packages
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Manage package and service definitions
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Create gym access and service-style packages, optionally connect a
          coach, and configure one simple time restriction.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            isArchivedView
              ? "border-border bg-card text-secondary hover:border-brand hover:text-primary-active"
              : "border-brand bg-soft-blue text-primary-active"
          }`}
          href="/admin/packages"
        >
          Active packages ({activeCount})
        </Link>
        <Link
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${
            isArchivedView
              ? "border-brand bg-soft-blue text-primary-active"
              : "border-border bg-card text-secondary hover:border-brand hover:text-primary-active"
          }`}
          href="/admin/packages?view=archived"
        >
          Archived packages ({archivedCount})
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

      <AdminPackageManager
        archivedView={isArchivedView}
        categories={categories}
        categoryError={!isArchivedView && params.error === "invalid-categories"}
        coaches={coaches}
        packages={packageValues}
        selectedPackageId={params.package}
      />
    </>
  );
}
