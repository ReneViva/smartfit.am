import type { CustomerPackageStatus } from "@prisma/client";

import { StatusBadge } from "../ui/status-badge";

type CustomerPackageValue = {
  activationDate: Date;
  coach: {
    firstName: string;
    lastName: string;
  } | null;
  expirationDate: Date;
  id: string;
  initialSessions: number;
  package: {
    name: string;
    packageType: string;
  };
  remainingSessions: number;
  status: CustomerPackageStatus;
};

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value);
}

export function CustomerPackageOverview({
  packages,
}: {
  packages: CustomerPackageValue[];
}) {
  if (!packages.length) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center text-sm text-secondary">
        No packages assigned. This customer can still exist without an active
        package.
      </p>
    );
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
        <thead className="bg-page text-xs uppercase tracking-wide text-secondary">
          <tr>
            <th className="px-4 py-3">Package</th>
            <th className="px-4 py-3">Coach</th>
            <th className="px-4 py-3">Activation</th>
            <th className="px-4 py-3">Expiration</th>
            <th className="px-4 py-3">Sessions</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((customerPackage) => {
            const isExpired =
              customerPackage.status === "EXPIRED" ||
              customerPackage.expirationDate < today;
            const hasZeroSessions = customerPackage.remainingSessions === 0;

            return (
              <tr
                className="border-t border-border align-top"
                key={customerPackage.id}
              >
                <td className="px-4 py-4">
                  <p className="font-bold text-foreground">
                    {customerPackage.package.name}
                  </p>
                  <p className="mt-1 text-secondary">
                    {customerPackage.package.packageType}
                  </p>
                </td>
                <td className="px-4 py-4 text-secondary">
                  {customerPackage.coach
                    ? `${customerPackage.coach.firstName} ${customerPackage.coach.lastName}`
                    : "Not assigned"}
                </td>
                <td className="px-4 py-4 text-secondary">
                  {displayDate(customerPackage.activationDate)}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={
                      isExpired
                        ? "font-bold text-button-danger"
                        : "text-secondary"
                    }
                  >
                    {displayDate(customerPackage.expirationDate)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p
                    className={
                      hasZeroSessions
                        ? "font-bold text-button-danger"
                        : "font-semibold text-foreground"
                    }
                  >
                    {customerPackage.remainingSessions} remaining
                  </p>
                  <p className="mt-1 text-secondary">
                    {customerPackage.initialSessions} initial
                  </p>
                  {hasZeroSessions ? (
                    <StatusBadge className="mt-2" status="expired">
                      Zero sessions
                    </StatusBadge>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge
                    status={
                      isExpired
                        ? "expired"
                        : customerPackage.status === "ACTIVE"
                          ? "active"
                          : customerPackage.status === "FROZEN"
                            ? "medium"
                            : "notInGym"
                    }
                  >
                    {isExpired && customerPackage.status !== "EXPIRED"
                      ? "Expired by date"
                      : customerPackage.status.toLowerCase()}
                  </StatusBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
