import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { db } from "../../../lib/db";
import { savePackageAction } from "./actions";

type PackagesPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

const errorMessages: Record<string, string> = {
  "incomplete-restriction":
    "A restricted package needs an end time or a useful restriction label.",
  "invalid-coach": "The selected coach is not available.",
  "invalid-price":
    "Price must be a non-negative number with no more than two decimal places.",
  "invalid-required": "Name, price, and package type are required.",
  "invalid-sessions": "Session count must be a non-negative whole number.",
  "invalid-time": "Time values must use a valid 24-hour time.",
  "invalid-time-order": "Start time must be earlier than end time.",
  unavailable: "Package could not be saved. Please try again.",
};

type CoachOption = {
  firstName: string;
  id: string;
  isActive: boolean;
  lastName: string;
};

type PackageFormValue = {
  allowedEndTime: string | null;
  allowedStartTime: string | null;
  assignedCoachId: string | null;
  description: string | null;
  hasTimeRestriction: boolean;
  id: string;
  isActive: boolean;
  name: string;
  packageType: string;
  price: string;
  sessionCount: number;
  timeRestrictionLabel: string | null;
};

function PackageFields({
  coaches,
  gymPackage,
}: {
  coaches: CoachOption[];
  gymPackage?: PackageFormValue;
}) {
  return (
    <>
      {gymPackage ? (
        <input name="id" type="hidden" value={gymPackage.id} />
      ) : null}
      <div className="grid gap-5 md:grid-cols-2">
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
          Package type
          <input
            className={inputClass}
            defaultValue={gymPackage?.packageType ?? ""}
            maxLength={200}
            name="packageType"
            placeholder="General gym, personal training..."
            required
          />
        </label>
        <label className={labelClass}>
          Price
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
        <label className={`${labelClass} md:col-span-2`}>
          Description
          <textarea
            className={`${inputClass} min-h-28`}
            defaultValue={gymPackage?.description ?? ""}
            maxLength={2000}
            name="description"
          />
        </label>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-lg bg-neutral px-4 py-3 text-sm font-semibold text-foreground">
          <input
            defaultChecked={gymPackage?.isActive ?? true}
            name="isActive"
            type="checkbox"
          />
          Active and visible on the public packages page
        </label>
        <label className="flex items-center gap-3 rounded-lg bg-neutral px-4 py-3 text-sm font-semibold text-foreground">
          <input
            defaultChecked={gymPackage?.hasTimeRestriction ?? false}
            name="hasTimeRestriction"
            type="checkbox"
          />
          Use a simple time restriction
        </label>
      </div>

      <div className="mt-5 rounded-xl border border-border p-5">
        <p className="text-sm font-semibold text-foreground">
          Time restriction details
        </p>
        <p className="mt-1 text-sm leading-6 text-secondary">
          Leave restriction disabled for all-day access. Disabling it clears
          these fields when saved.
        </p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
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
    </>
  );
}

export default async function PackagesPage({ searchParams }: PackagesPageProps) {
  const [packages, coaches, params] = await Promise.all([
    db.package.findMany({
      orderBy: { name: "asc" },
      select: {
        allowedEndTime: true,
        allowedStartTime: true,
        assignedCoachId: true,
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
    searchParams,
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const packageValues = packages.map((gymPackage) => ({
    ...gymPackage,
    price: gymPackage.price.toString(),
  }));

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Packages
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Manage package definitions
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Create public package definitions, optionally connect a coach, and
          configure one simple time restriction.
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

      <Card className="mt-8">
        <h3 className="text-xl font-bold text-foreground">Create package</h3>
        <form action={savePackageAction} className="mt-5">
          <PackageFields coaches={coaches} />
          <Button className="mt-5" type="submit">
            Create package
          </Button>
        </form>
      </Card>

      <section className="mt-10">
        <h3 className="text-2xl font-bold text-foreground">Existing packages</h3>
        {packageValues.length ? (
          <div className="mt-5 space-y-6">
            {packageValues.map((gymPackage) => (
              <Card key={gymPackage.id}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-brand">
                      {gymPackage.packageType}
                    </p>
                    <h4 className="mt-1 text-xl font-bold text-foreground">
                      {gymPackage.name}
                    </h4>
                  </div>
                  <span className="rounded-full bg-neutral px-3 py-1 text-xs font-semibold text-secondary">
                    {gymPackage.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <form action={savePackageAction}>
                  <PackageFields coaches={coaches} gymPackage={gymPackage} />
                  <Button className="mt-5" type="submit">
                    Save changes
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
            No package definitions have been created yet.
          </p>
        )}
      </section>
    </>
  );
}
