import Link from "next/link";

import { checkOutAction } from "../actions";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/ui/status-badge";
import { membershipDisplayName } from "../../../lib/customer-memberships";
import { db } from "../../../lib/db";

type InGymPageProps = {
  searchParams: Promise<{ q?: string }>;
};

function displayDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function timeInside(checkedInAt: Date) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - checkedInAt.getTime()) / 60_000),
  );
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

export default async function InGymPage({ searchParams }: InGymPageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 200) ?? "";
  const visits = await db.gymVisit.findMany({
    orderBy: { checkedInAt: "asc" },
    select: {
      checkedInAt: true,
      guestCountUsed: true,
      occupancyDelta: true,
      customer: {
        select: {
          assignedCoach: {
            select: { firstName: true, lastName: true },
          },
          customerCode: true,
          fullName: true,
          id: true,
        },
      },
      packageUsages: {
        select: {
          customerPackage: {
            select: {
              membershipName: true,
              package: { select: { name: true } },
            },
          },
        },
      },
    },
    take: 100,
    where: {
      checkedOutAt: null,
      customer: {
        is: {
          deletedAt: null,
          gymPresenceStatus: "IN_GYM",
          ...(query
            ? {
                OR: [
                  { customerCode: { contains: query, mode: "insensitive" } },
                  { fullName: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      },
    },
  });

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Currently in gym
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Who is inside right now?
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Customers with an open visit who have not checked out yet.
        </p>
      </header>

      <Card className="mt-8 p-5">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 text-sm font-semibold text-foreground">
            Search people inside
            <input
              className="mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
              defaultValue={query}
              name="q"
              placeholder="Name or member code..."
            />
          </label>
          <Button pendingLabel="Searching..." type="submit">
            Search
          </Button>
          {query ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-brand"
              href="/registration/in-gym"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </Card>

      {visits.length ? (
        <div className="mt-6 max-h-[70vh] space-y-4 overflow-y-auto overscroll-contain pr-1">
          {visits.map((visit) => {
            const membershipNames = visit.packageUsages.map(
              (usage) => membershipDisplayName(usage.customerPackage),
            );

            return (
              <Card className="p-5" key={`${visit.customer.id}-${visit.checkedInAt.toISOString()}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status="inGym">in gym</StatusBadge>
                      {visit.guestCountUsed > 0 ? (
                        <StatusBadge status="active">
                          +{visit.guestCountUsed} guest
                          {visit.guestCountUsed === 1 ? "" : "s"} · party{" "}
                          {visit.occupancyDelta}
                        </StatusBadge>
                      ) : null}
                      <span className="text-sm font-semibold text-secondary">
                        Member ID: {visit.customer.customerCode}
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-foreground">
                      {visit.customer.fullName}
                    </h3>
                    <p className="mt-2 text-sm text-secondary">
                      Coach:{" "}
                      {visit.customer.assignedCoach
                        ? `${visit.customer.assignedCoach.firstName} ${visit.customer.assignedCoach.lastName}`
                        : "Not assigned"}
                    </p>
                    <p className="mt-1 text-sm text-secondary">
                      Checked in {displayDateTime(visit.checkedInAt)} · inside{" "}
                      {timeInside(visit.checkedInAt)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-secondary">
                      Used memberships:{" "}
                      {membershipNames.length ? membershipNames.join(", ") : "None"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <Link
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral px-4 py-2 text-sm font-semibold text-foreground hover:bg-neutral-hover"
                      href={`/registration?customer=${encodeURIComponent(visit.customer.customerCode)}`}
                    >
                      Open customer
                    </Link>
                    <form action={checkOutAction}>
                      <input
                        name="customerCode"
                        type="hidden"
                        value={visit.customer.customerCode}
                      />
                      <input
                        name="customerId"
                        type="hidden"
                        value={visit.customer.id}
                      />
                      <input name="showAllPackages" type="hidden" value="0" />
                      <Button
                        className="w-full"
                        pendingLabel="Checking out..."
                        type="submit"
                        variant="warning"
                      >
                        Check out
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-secondary">
          No customers are currently inside.
        </p>
      )}
    </>
  );
}
