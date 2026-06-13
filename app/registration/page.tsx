import Link from "next/link";

import { RegistrationCustomerCard } from "../../components/registration/customer-card";
import { OccupancyCorrection } from "../../components/registration/occupancy-correction";
import { Card } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { db } from "../../lib/db";
import { noteWithStaffSelect, toCustomerNoteView } from "../../lib/notes";

export const dynamic = "force-dynamic";

type RegistrationPageProps = {
  searchParams: Promise<{
    customer?: string;
    error?: string;
    q?: string;
    showAll?: string;
    status?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "already-in-gym": "This customer is already in the gym.",
  "check-out-stale":
    "The customer or occupancy changed before check-out. Review and try again.",
  "check-out-unavailable":
    "Check-out could not be completed. Please try again.",
  "check-in-unavailable": "Check-in could not be completed. Please try again.",
  "correction-unavailable":
    "The session correction could not be saved. Please try again.",
  "invalid-check-in": "The selected customer is unavailable.",
  "invalid-correction":
    "Enter a valid non-negative whole number for remaining sessions.",
  "invalid-check-out": "The selected customer is unavailable for check-out.",
  "invalid-occupancy-correction":
    "Enter a valid non-negative whole number for occupancy.",
  "invalid-package":
    "One or more selected packages are not usable for check-in.",
  "open-visit": "This customer already has an open gym visit.",
  "no-open-visit":
    "This customer has no open gym visit and cannot be checked out.",
  "not-in-gym": "This customer is not currently in the gym.",
  "occupancy-correction-unavailable":
    "The occupancy correction could not be saved. Please try again.",
  "occupancy-zero":
    "Occupancy is already zero. Correct the live count before checking out.",
  "package-selection-required":
    "Select at least one usable package before check-in.",
  "package-stale":
    "A selected package changed before check-in. Review it and try again.",
  "stale-correction":
    "Sessions changed after this card loaded. Review the updated value and try again.",
  "stale-occupancy":
    "Occupancy changed after this page loaded. Review the current count and try again.",
};

export default async function RegistrationPage({
  searchParams,
}: RegistrationPageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 200) ?? "";
  const selectedCustomerCode = params.customer?.trim().slice(0, 100) ?? "";
  const settings = await db.gymSettings.findFirst({
    select: { hideInactiveCustomersFromRegistration: true },
  });
  const hideInactiveCustomers =
    settings?.hideInactiveCustomersFromRegistration ?? false;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const customerVisibility = {
    deletedAt: null,
    ...(hideInactiveCustomers ? { status: "ACTIVE" as const } : {}),
  };
  const [searchResults, selectedCustomer, occupancy] = await Promise.all([
    query
      ? db.customer.findMany({
          orderBy: [{ fullName: "asc" }, { customerCode: "asc" }],
          select: {
            customerCode: true,
            fullName: true,
            gymPresenceStatus: true,
            status: true,
            _count: {
              select: {
                packages: {
                  where: {
                    deletedAt: null,
                    expirationDate: { gte: today },
                    remainingSessions: { gt: 0 },
                    status: "ACTIVE",
                  },
                },
              },
            },
          },
          take: 25,
          where: {
            ...customerVisibility,
            OR: [
              { customerCode: { contains: query, mode: "insensitive" } },
              { fullName: { contains: query, mode: "insensitive" } },
            ],
          },
        })
      : Promise.resolve([]),
    selectedCustomerCode
      ? db.customer.findFirst({
          include: {
            assignedCoach: {
              select: { firstName: true, lastName: true },
            },
            notes: {
              orderBy: [{ createdAt: "desc" }, { id: "desc" }],
              select: noteWithStaffSelect,
              where: { deletedAt: null },
            },
            packages: {
              include: {
                coach: {
                  select: { firstName: true, lastName: true },
                },
                package: {
                  select: {
                    allowedEndTime: true,
                    allowedStartTime: true,
                    assignedCoach: {
                      select: { firstName: true, lastName: true },
                    },
                    deletedAt: true,
                    hasTimeRestriction: true,
                    isActive: true,
                    name: true,
                    timeRestrictionLabel: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              where: { deletedAt: null },
            },
          },
          where: {
            ...customerVisibility,
            customerCode: selectedCustomerCode,
          },
        })
      : Promise.resolve(null),
    db.occupancyState.findFirst({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        currentCount: true,
      },
    }),
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage =
    params.status === "checked-in"
      ? "Customer checked in successfully."
      : params.status === "checked-out"
        ? "Customer checked out successfully."
        : params.status === "correction-saved"
        ? "Remaining sessions updated and logged."
        : params.status === "occupancy-corrected"
          ? "Live occupancy updated and logged."
          : params.status === "occupancy-no-change"
            ? "No occupancy change was needed."
        : params.status === "no-change"
          ? "No session change was needed."
          : null;

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Registration
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Find a customer
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Search by full name or member ID to review current status and package
          sessions.
        </p>
      </header>

      {hideInactiveCustomers ? (
        <p className="mt-6 rounded-xl border border-status-medium bg-card px-4 py-3 text-sm font-semibold text-foreground">
          Inactive customers are hidden by the current admin setting.
        </p>
      ) : null}
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

      <OccupancyCorrection
        currentCount={Math.max(0, occupancy?.currentCount ?? 0)}
        customerCode={selectedCustomerCode || null}
        showAllPackages={params.showAll === "1"}
      />

      <Card className="mt-8">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-semibold text-foreground">
            Customer full name or member ID
            <input
              autoFocus
              className="mt-2 min-h-12 w-full rounded-lg border border-input-border bg-card px-4 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
              defaultValue={query}
              name="q"
              placeholder="Search name or 0012..."
            />
          </label>
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            type="submit"
          >
            Search
          </button>
        </form>
      </Card>

      {query ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                Search results
              </h3>
              <p className="mt-1 text-sm text-secondary">
                {searchResults.length} matching customer
                {searchResults.length === 1 ? "" : "s"}.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-brand hover:text-primary-hover"
              href="/registration"
            >
              Clear search
            </Link>
          </div>

          {searchResults.length ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {searchResults.map((customer) => (
                <Link
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-brand hover:bg-soft-blue"
                  href={`/registration?q=${encodeURIComponent(query)}&customer=${encodeURIComponent(customer.customerCode)}`}
                  key={customer.customerCode}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-brand">
                        Member ID: {customer.customerCode}
                      </p>
                      <p className="mt-1 text-xl font-bold text-foreground">
                        {customer.fullName}
                      </p>
                      <p className="mt-2 text-sm text-secondary">
                        {customer._count.packages} usable package
                        {customer._count.packages === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        status={
                          customer.status === "ACTIVE" ? "active" : "notInGym"
                        }
                      >
                        {customer.status.toLowerCase()}
                      </StatusBadge>
                      <StatusBadge
                        status={
                          customer.gymPresenceStatus === "IN_GYM"
                            ? "inGym"
                            : "notInGym"
                        }
                      >
                        {customer.gymPresenceStatus
                          .toLowerCase()
                          .replaceAll("_", " ")}
                      </StatusBadge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
              No customers match that name or member ID.
            </p>
          )}
        </section>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
          Enter a customer name or member ID to begin.
        </p>
      )}

      {selectedCustomer ? (
        <RegistrationCustomerCard
          customer={{
            ...selectedCustomer,
            notes: selectedCustomer.notes.map(toCustomerNoteView),
          }}
          showAllPackages={params.showAll === "1"}
        />
      ) : selectedCustomerCode ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
          That customer is unavailable or hidden by registration settings.
        </p>
      ) : null}
    </>
  );
}
