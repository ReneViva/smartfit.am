import { AdminPackageManager } from "../../../components/admin/admin-package-manager";
import { db } from "../../../lib/db";

type PackagesPageProps = {
  searchParams: Promise<{
    error?: string;
    package?: string;
    status?: string;
  }>;
};

const errorMessages: Record<string, string> = {
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
  "invalid-sessions": "Session count must be a non-negative whole number.",
  "invalid-time": "Time values must use a valid 24-hour time.",
  "invalid-time-order": "Start time must be earlier than end time.",
  "invalid-url": "Image URLs must use http or https.",
  unavailable: "Package could not be saved. Please try again.",
  "upload-configuration":
    "Image upload storage is not configured. Add storage values to .env or use an image URL.",
  "upload-failed": "Image upload failed. Try again or use an image URL.",
  "upload-file-size": "Image files must be 5 MB or smaller.",
  "upload-file-type": "Choose a valid image file.",
};

export default async function PackagesPage({ searchParams }: PackagesPageProps) {
  const [packages, coaches, categories, params] = await Promise.all([
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
      where: { deletedAt: null },
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
    searchParams,
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const packageValues = packages.map((gymPackage) => ({
    ...gymPackage,
    categories: gymPackage.categories.map(({ category }) => category),
    createdAt: gymPackage.createdAt.toISOString(),
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

      {params.status === "saved" ? (
        <p className="mt-6 rounded-xl border border-status-low bg-card px-4 py-3 text-sm font-semibold text-foreground">
          Package saved.
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
        categories={categories}
        categoryError={params.error === "invalid-categories"}
        coaches={coaches}
        packages={packageValues}
        selectedPackageId={params.package}
      />
    </>
  );
}
