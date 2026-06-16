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
  "invalid-freeze-chances":
    "Default freeze chances must be a non-negative whole number.",
  "invalid-guest-passes":
    "Default guest passes must be a non-negative whole number.",
  "invalid-price":
    "Price must be a non-negative number with no more than two decimal places.",
  "invalid-required": "Name, price, and package/service type are required.",
  "invalid-sessions": "Session count must be a non-negative whole number.",
  "invalid-time": "Time values must use a valid 24-hour time.",
  "invalid-time-order": "Start time must be earlier than end time.",
  unavailable: "Package could not be saved. Please try again.",
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
        hasTimeRestriction: true,
        id: true,
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
