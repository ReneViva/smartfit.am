import {
  CustomerPackageStatus,
  CustomerStatus,
  GymPresenceStatus,
  Prisma,
} from "@prisma/client";
import Link from "next/link";

import { CustomerForm } from "../../../components/admin/customer-form";
import { CustomerPackageAssignmentForm } from "../../../components/admin/customer-package-assignment-form";
import { CustomerPackageOverview } from "../../../components/admin/customer-package-overview";
import { Card } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/ui/status-badge";
import { db } from "../../../lib/db";

type CustomersPageProps = {
  searchParams: Promise<{
    attention?: string;
    coachId?: string;
    customerStatus?: string;
    error?: string;
    packageId?: string;
    packageStatus?: string;
    presence?: string;
    q?: string;
    status?: string;
  }>;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

const errorMessages: Record<string, string> = {
  "assignment-unavailable":
    "The package assignment could not be saved. Please try again.",
  "customer-unavailable": "The customer could not be saved. Please try again.",
  "duplicate-code": "That member code is already assigned to another customer.",
  "invalid-assignment":
    "Choose a customer package and enter valid dates, sessions, and status.",
  "invalid-coach": "The selected coach is not available.",
  "invalid-customer": "Member code, full name, and a valid status are required.",
  "invalid-date-order": "Expiration date cannot be before activation date.",
  "invalid-package": "Choose an active package definition.",
};

function selectedEnum<T extends string>(
  value: string | undefined,
  values: readonly T[],
) {
  return value && values.includes(value as T) ? (value as T) : null;
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 200) ?? "";
  const customerStatus = selectedEnum(
    params.customerStatus,
    Object.values(CustomerStatus),
  );
  const presence = selectedEnum(
    params.presence,
    Object.values(GymPresenceStatus),
  );
  const packageStatus = selectedEnum(
    params.packageStatus,
    Object.values(CustomerPackageStatus),
  );
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const conditions: Prisma.CustomerWhereInput[] = [];

  if (query) {
    conditions.push({
      OR: [
        { customerCode: { contains: query, mode: "insensitive" } },
        { fullName: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (customerStatus) {
    conditions.push({ status: customerStatus });
  }

  if (presence) {
    conditions.push({ gymPresenceStatus: presence });
  }

  if (params.coachId) {
    conditions.push({ assignedCoachId: params.coachId });
  }

  if (params.packageId) {
    conditions.push({
      packages: {
        some: { deletedAt: null, packageId: params.packageId },
      },
    });
  }

  if (packageStatus) {
    conditions.push({
      packages: {
        some: { deletedAt: null, status: packageStatus },
      },
    });
  }

  if (params.attention === "zero") {
    conditions.push({
      packages: {
        some: { deletedAt: null, remainingSessions: 0 },
      },
    });
  }

  if (params.attention === "expired") {
    conditions.push({
      packages: {
        some: {
          deletedAt: null,
          OR: [{ status: "EXPIRED" }, { expirationDate: { lt: today } }],
        },
      },
    });
  }

  const where: Prisma.CustomerWhereInput = {
    deletedAt: null,
    ...(conditions.length ? { AND: conditions } : {}),
  };

  const [
    customers,
    coaches,
    activePackages,
    packageDefinitions,
    totalCustomers,
    activeCustomers,
    customersInGym,
    attentionPackages,
  ] = await Promise.all([
    db.customer.findMany({
      include: {
        assignedCoach: {
          select: { firstName: true, lastName: true },
        },
        packages: {
          include: {
            coach: {
              select: { firstName: true, lastName: true },
            },
            package: {
              select: { name: true, packageType: true },
            },
          },
          orderBy: { createdAt: "desc" },
          where: { deletedAt: null },
        },
      },
      orderBy: [{ fullName: "asc" }, { customerCode: "asc" }],
      where,
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
    db.package.findMany({
      orderBy: { name: "asc" },
      select: {
        assignedCoachId: true,
        id: true,
        name: true,
        packageType: true,
        sessionCount: true,
      },
      where: { deletedAt: null, isActive: true },
    }),
    db.package.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        isActive: true,
        name: true,
      },
      where: { deletedAt: null },
    }),
    db.customer.count({ where: { deletedAt: null } }),
    db.customer.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.customer.count({
      where: { deletedAt: null, gymPresenceStatus: "IN_GYM" },
    }),
    db.customerPackage.count({
      where: {
        deletedAt: null,
        OR: [
          { expirationDate: { lt: today } },
          { remainingSessions: 0 },
          { status: "EXPIRED" },
        ],
      },
    }),
  ]);

  const errorMessage = params.error ? errorMessages[params.error] : null;
  const statusMessage =
    params.status === "customer-saved"
      ? "Customer saved."
      : params.status === "package-assigned"
        ? "Package assigned. A new package history record was created."
        : null;
  const stats = [
    { label: "Total customers", value: totalCustomers },
    { label: "Active customers", value: activeCustomers },
    { label: "Currently in gym", value: customersInGym },
    { label: "Packages needing attention", value: attentionPackages },
  ];

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Customers
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Customer and package management
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Manage member profiles, assigned coaches, and package history. Member
          codes remain separate from generated internal database IDs.
        </p>
      </header>

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

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm font-semibold text-secondary">{stat.label}</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-foreground">
              {stat.value}
            </p>
          </Card>
        ))}
      </section>

      <Card className="mt-8">
        <h3 className="text-xl font-bold text-foreground">Create customer</h3>
        <p className="mt-2 text-sm leading-6 text-secondary">
          Required fields are member code, full name, and status. New customers
          always start as not in gym.
        </p>
        <div className="mt-6">
          <CustomerForm coaches={coaches} />
        </div>
      </Card>

      <Card className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Search and filter
            </h3>
            <p className="mt-2 text-sm text-secondary">
              Search by full name or member code.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-brand hover:text-primary-hover"
            href="/admin/customers"
          >
            Clear filters
          </Link>
        </div>
        <form className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className={`${labelClass} md:col-span-2`}>
            Name or member code
            <input
              className={inputClass}
              defaultValue={query}
              name="q"
              placeholder="Search customers..."
            />
          </label>
          <label className={labelClass}>
            Customer status
            <select
              className={inputClass}
              defaultValue={customerStatus ?? ""}
              name="customerStatus"
            >
              <option value="">All statuses</option>
              {Object.values(CustomerStatus).map((status) => (
                <option key={status} value={status}>
                  {status.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Gym presence
            <select
              className={inputClass}
              defaultValue={presence ?? ""}
              name="presence"
            >
              <option value="">All presence states</option>
              {Object.values(GymPresenceStatus).map((status) => (
                <option key={status} value={status}>
                  {status.toLowerCase().replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Assigned coach
            <select
              className={inputClass}
              defaultValue={params.coachId ?? ""}
              name="coachId"
            >
              <option value="">All coaches</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.firstName} {coach.lastName}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Package definition
            <select
              className={inputClass}
              defaultValue={params.packageId ?? ""}
              name="packageId"
            >
              <option value="">All packages</option>
              {packageDefinitions.map((gymPackage) => (
                <option key={gymPackage.id} value={gymPackage.id}>
                  {gymPackage.name}
                  {gymPackage.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Package status
            <select
              className={inputClass}
              defaultValue={packageStatus ?? ""}
              name="packageStatus"
            >
              <option value="">All package statuses</option>
              {Object.values(CustomerPackageStatus).map((status) => (
                <option key={status} value={status}>
                  {status.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Package attention
            <select
              className={inputClass}
              defaultValue={params.attention ?? ""}
              name="attention"
            >
              <option value="">All packages</option>
              <option value="expired">Expired packages</option>
              <option value="zero">Zero-session packages</option>
            </select>
          </label>
          <button
            className="inline-flex min-h-11 items-center justify-center self-end rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            type="submit"
          >
            Apply filters
          </button>
        </form>
      </Card>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Customer package overview
            </h3>
            <p className="mt-2 text-sm text-secondary">
              Showing {customers.length} matching customer
              {customers.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        {customers.length ? (
          <div className="mt-5 space-y-6">
            {customers.map((customer) => (
              <Card key={customer.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-brand">
                      Member ID: {customer.customerCode}
                    </p>
                    <h4 className="mt-1 text-2xl font-bold text-foreground">
                      {customer.fullName}
                    </h4>
                    <p className="mt-2 text-sm text-secondary">
                      Assigned coach:{" "}
                      {customer.assignedCoach
                        ? `${customer.assignedCoach.firstName} ${customer.assignedCoach.lastName}`
                        : "Not assigned"}
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

                <div className="mt-6">
                  <CustomerPackageOverview packages={customer.packages} />
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  <details className="rounded-xl border border-border bg-page p-5">
                    <summary className="cursor-pointer font-bold text-foreground">
                      Edit customer profile
                    </summary>
                    <div className="mt-5">
                      <CustomerForm coaches={coaches} customer={customer} />
                    </div>
                  </details>
                  <details className="rounded-xl border border-border bg-page p-5">
                    <summary className="cursor-pointer font-bold text-foreground">
                      Assign or renew package
                    </summary>
                    <div className="mt-5">
                      <CustomerPackageAssignmentForm
                        coaches={coaches}
                        customerId={customer.id}
                        packages={activePackages}
                      />
                    </div>
                  </details>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
            No customers match the current filters.
          </p>
        )}
      </section>
    </>
  );
}
