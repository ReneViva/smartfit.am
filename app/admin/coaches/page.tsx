import { AdminExpandableCard } from "../../../components/admin/admin-expandable-card";
import { ImageInput } from "../../../components/admin/image-input";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/ui/status-badge";
import { db } from "../../../lib/db";
import { saveCoachAction } from "./actions";

type CoachesPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

const errorMessages: Record<string, string> = {
  "invalid-required": "First name, last name, and specialty are required.",
  "invalid-url": "Photo URL must use a valid http or https URL.",
  "upload-configuration":
    "Image upload storage is not configured. Add storage values to .env or use an image URL.",
  "upload-failed": "Image upload failed. Try again or use an image URL.",
  "upload-file-size": "Image files must be 5 MB or smaller.",
  "upload-file-type": "Choose a valid image file.",
  unavailable: "Coach could not be saved. Please try again.",
};

type CoachFormValue = {
  contactInfo: string | null;
  description: string | null;
  firstName: string;
  id: string;
  isActive: boolean;
  lastName: string;
  photoUrl: string | null;
  specialty: string;
};

function CoachFields({ coach }: { coach?: CoachFormValue }) {
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
    </>
  );
}

export default async function CoachesPage({ searchParams }: CoachesPageProps) {
  const [coaches, params] = await Promise.all([
    db.coach.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        contactInfo: true,
        description: true,
        firstName: true,
        id: true,
        isActive: true,
        lastName: true,
        photoUrl: true,
        specialty: true,
      },
      where: { deletedAt: null },
    }),
    searchParams,
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;

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

      {params.status === "saved" ? (
        <p className="mt-6 rounded-xl border border-status-low bg-card px-4 py-3 text-sm font-semibold text-foreground">
          Coach saved.
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
        <h3 className="text-xl font-bold text-foreground">Create coach</h3>
        <form action={saveCoachAction} className="mt-5">
          <CoachFields />
          <Button className="mt-5" type="submit">
            Create coach
          </Button>
        </form>
      </Card>

      <section className="mt-10">
        <h3 className="text-2xl font-bold text-foreground">Existing coaches</h3>
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
                          status={coach.isActive ? "active" : "notInGym"}
                        >
                          {coach.isActive ? "Active" : "Inactive"}
                        </StatusBadge>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-secondary">
                        {coach.description || "No coach description provided."}
                      </p>
                    </div>
                  </div>
                }
              >
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                    Editing coach
                  </p>
                  <h4 className="mt-1 text-lg font-bold text-foreground">
                    {coach.firstName} {coach.lastName}
                  </h4>
                </div>
                <form action={saveCoachAction}>
                  <CoachFields coach={coach} />
                  <Button className="mt-5" type="submit">
                    Save changes
                  </Button>
                </form>
              </AdminExpandableCard>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
            No coaches have been created yet.
          </p>
        )}
      </section>
    </>
  );
}
