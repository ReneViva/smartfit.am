import { OccupancyCorrection } from "../../../components/registration/occupancy-correction";
import { db } from "../../../lib/db";

type OccupancyPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

const messages: Record<string, string> = {
  "invalid-occupancy-correction":
    "Enter a valid non-negative whole number for occupancy.",
  "occupancy-corrected": "Live occupancy updated and logged.",
  "occupancy-correction-unavailable":
    "Occupancy correction could not be completed.",
  "occupancy-no-change": "No occupancy change was needed.",
  "stale-occupancy":
    "Occupancy changed before Save. Review the latest count and try again.",
};

export default async function OccupancyPage({
  searchParams,
}: OccupancyPageProps) {
  const params = await searchParams;
  const occupancy = await db.occupancyState.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { currentCount: true },
  });
  const message = params.status
    ? messages[params.status]
    : params.error
      ? messages[params.error]
      : null;

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Occupancy
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Correct the live count
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Use manual correction only when the live count is wrong. Saving is
          logged and updates the public live occupancy view.
        </p>
      </header>
      {message ? (
        <p className="mt-6 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">
          {message}
        </p>
      ) : null}
      <div className="mt-8">
        <OccupancyCorrection
          compact={false}
          currentCount={Math.max(0, occupancy?.currentCount ?? 0)}
          customerCode={null}
          returnPath="/registration/occupancy"
          showAllPackages={false}
        />
      </div>
    </>
  );
}
