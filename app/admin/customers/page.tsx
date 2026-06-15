import {
  CustomerPackageStatus,
  CustomerStatus,
  GymPresenceStatus,
  Prisma,
} from "@prisma/client";
import Link from "next/link";

import { CustomerForm } from "../../../components/admin/customer-form";
import { Card } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/ui/status-badge";
import { db } from "../../../lib/db";
import { packageTypeLabel } from "../../../lib/package-types";

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
  "customer-unavailable": "The customer could not be saved. Please try again.",
  "duplicate-code": "That member code is already assigned to another customer.",
  "invalid-birth-date": "Birth date cannot be in the future.",
  "invalid-coach": "The selected coach is not available.",
  "invalid-customer":
    "Member code, full name, birth date, and a valid status are required.",
};

function selectedEnum<T extends string>(
  value: string | undefined,
  values: readonly T[],
) {
  return value && values.includes(value as T) ? (value as T) : null;
}

function displayDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(value)
    : "Missing";
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
        { phone: { contains: query, mode: "insensitive" } },
        { emergencyPhone: { contains: query, mode: "insensitive" } },
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

  if (params.attention === "missing-birth-date") {
    conditions.push({ birthDate: null });
  }

  const where: Prisma.CustomerWhereInput = {
    deletedAt: null,
    ...(conditions.length ? { AND: conditions } : {}),
  };

  const [
    customers,
    coaches,
    packageDefinitions,
    totalCustomers,
    activeCustomers,
    customersInGym,
    attentionPackages,
    missingBirthDates,
  ] = await Promise.all([
    db.customer.findMany({
      orderBy: [{ fullName: "asc" }, { customerCode: "asc" }],
      select: {
        _count: {
          select: {
            notes: { where: { deletedAt: null } },
            packages: { where: { deletedAt: null } },
          },
        },
        assignedCoach: {
          select: { firstName: true, lastName: true },
        },
        birthDate: true,
        customerCode: true,
        fullName: true,
        gymPresenceStatus: true,
        id: true,
        phone: true,
        status: true,
      },
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
        id: true,
        isActive: true,
        name: true,
        packageType: true,
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
    db.customer.count({ where: { birthDate: null, deletedAt: null } }),
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const stats = [
    { label: "Total customers", value: totalCustomers },
    { label: "Active customers", value: activeCustomers },
    { label: "Currently in gym", value: customersInGym },
    { label: "Packages needing attention", value: attentionPackages },
    { label: "Missing birth dates", value: missingBirthDates },
  ];

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Customers
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Customer management
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Find a member and open their dedicated workspace for profile,
          packages, history, and important notes.
        </p>
      </header>

      {params.status === "customer-saved" ? (
        <p className="mt-6 rounded-xl border border-status-low bg-card px-4 py-3 text-sm font-semibold text-foreground">
          Customer created successfully.
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

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card className="p-5" key={stat.label}>
            <p className="text-sm font-semibold text-secondary">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              {stat.value}
            </p>
          </Card>
        ))}
      </section>

      <details className="smooth-panel mt-8 rounded-2xl border border-border bg-card shadow-sm open:border-brand">
        <summary className="cursor-pointer list-none rounded-2xl px-5 py-4 font-bold text-foreground transition-colors hover:bg-soft-blue sm:px-6">
          Create a new customer
          <span className="mt-1 block text-sm font-normal text-secondary">
            Opens the customer registration form.
          </span>
        </summary>
        <div className="animate-panel-in border-t border-border p-5 sm:p-6">
          <CustomerForm coaches={coaches} />
        </div>
      </details>

      <Card className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Search and filter
            </h3>
            <p className="mt-2 text-sm text-secondary">
              Search by name, member code, phone, or emergency phone.
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
            Name, member code, or phone
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
            Package / service
            <select
              className={inputClass}
              defaultValue={params.packageId ?? ""}
              name="packageId"
            >
              <option value="">All packages</option>
              {packageDefinitions.map((gymPackage) => (
                <option key={gymPackage.id} value={gymPackage.id}>
                  {gymPackage.name} ·{" "}
                  {packageTypeLabel(gymPackage.packageType)}
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
            Needs attention
            <select
              className={inputClass}
              defaultValue={params.attention ?? ""}
              name="attention"
            >
              <option value="">All customers</option>
              <option value="expired">Expired packages</option>
              <option value="zero">Zero-session packages</option>
              <option value="missing-birth-date">Missing birth date</option>
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
              Customer directory
            </h3>
            <p className="mt-2 text-sm text-secondary">
              Showing {customers.length} matching customer
              {customers.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        {customers.length ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {customers.map((customer) => (
              <Link
                className="animate-list-item-in group rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-brand hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                href={`/admin/customers/${customer.id}`}
                key={customer.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                      Member ID: {customer.customerCode}
                    </p>
                    <h4 className="mt-2 break-words text-xl font-bold text-foreground">
                      {customer.fullName}
                    </h4>
                    <p className="mt-2 text-sm text-secondary">
                      {customer.assignedCoach
                        ? `Coach: ${customer.assignedCoach.firstName} ${customer.assignedCoach.lastName}`
                        : "No assigned coach"}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-brand transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                    Open workspace →
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
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
                  {!customer.birthDate ? (
                    <StatusBadge status="medium">
                      missing birth date
                    </StatusBadge>
                  ) : null}
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="font-semibold text-secondary">Birth date</dt>
                    <dd className="mt-1 text-foreground">
                      {displayDate(customer.birthDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-secondary">Phone</dt>
                    <dd className="mt-1 break-words text-foreground">
                      {customer.phone ?? "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-secondary">Packages</dt>
                    <dd className="mt-1 text-foreground">
                      {customer._count.packages}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-secondary">Notes</dt>
                    <dd className="mt-1 text-foreground">
                      {customer._count.notes}
                    </dd>
                  </div>
                </dl>
              </Link>
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
