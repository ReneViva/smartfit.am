import { Card } from "../../../components/ui/card";
import { db } from "../../../lib/db";

const rules = [
  "Check-in deducts selected packages only.",
  "Check-out does not deduct sessions.",
  "Frozen packages are blocked from check-in.",
  "Expired and zero-session packages are blocked from check-in.",
  "Time-restricted packages are checked during check-in.",
  "Manual session corrections require Save and are logged.",
  "Manual occupancy corrections require Save and are logged.",
];

export default async function RegistrationRulesPage() {
  const settings = await db.gymSettings.findFirst({
    select: { hideInactiveCustomersFromRegistration: true },
  });

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Reception rules
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Daily operational rules
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Read-only guidance for reception work. Admin manages system settings
          and public app configuration.
        </p>
      </header>
      <Card className="mt-8">
        <div className="rounded-xl border border-border bg-page px-4 py-3 text-sm text-secondary">
          Inactive customers are currently{" "}
          <strong className="text-foreground">
            {settings?.hideInactiveCustomersFromRegistration
              ? "hidden"
              : "visible"}
          </strong>{" "}
          in Registration search.
        </div>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {rules.map((rule) => (
            <li
              className="rounded-xl border border-border bg-page px-4 py-3 text-sm font-semibold leading-6 text-foreground"
              key={rule}
            >
              {rule}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
