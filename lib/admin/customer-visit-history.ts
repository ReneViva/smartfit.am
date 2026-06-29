import "server-only";

import type { Prisma } from "@prisma/client";

import { requireStaffRole } from "../auth";
import { membershipDisplayName } from "../customer-memberships";
import { db } from "../db";

export type CustomerVisitHistoryScope = "all" | "current";

export type CustomerVisitHistoryItem = {
  checkedInAt: Date;
  checkedOutAt: Date | null;
  guestCountUsed: number;
  id: string;
  occupancyDelta: number;
  packageUsages: {
    guestPassesDeducted: number;
    packageName: string;
    serviceInitialSessions: number | null;
    serviceName: string | null;
    serviceRemainingSessions: number | null;
    sessionsDeducted: number;
  }[];
};

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function serviceReferenceFromReason(reason: string | null) {
  const match = reason?.match(
    /^(?:Service check-in deduction|Manual service correction): (.*?) \[service:([^\]]+)\]/,
  );

  return match ? { id: match[2], name: match[1] } : null;
}

export async function getCustomerVisitHistoryForAdmin(
  customerId: string,
  options: { scope?: CustomerVisitHistoryScope; take?: number } = {},
): Promise<CustomerVisitHistoryItem[]> {
  await requireStaffRole("ADMIN");
  const scope = options.scope ?? "all";
  const currentMembership =
    scope === "current"
      ? await db.customerPackage.findFirst({
          orderBy: [{ activationDate: "desc" }, { createdAt: "desc" }],
          select: {
            activationDate: true,
            expirationDate: true,
            id: true,
          },
          where: {
            customerId,
            deletedAt: null,
            status: "ACTIVE",
          },
        })
      : null;

  if (scope === "current" && !currentMembership) {
    return [];
  }

  const where: Prisma.GymVisitWhereInput = { customerId };

  if (currentMembership) {
    where.OR = [
      {
        packageUsages: {
          some: { customerPackageId: currentMembership.id },
        },
      },
      {
        checkedInAt: {
          gte: currentMembership.activationDate,
          lt: addDays(currentMembership.expirationDate, 1),
        },
      },
    ];
  }

  const visits = await db.gymVisit.findMany({
    orderBy: [{ checkedInAt: "desc" }, { id: "desc" }],
    select: {
      checkedInAt: true,
      checkedOutAt: true,
      guestCountUsed: true,
      id: true,
      occupancyDelta: true,
      packageUsages: {
        orderBy: { createdAt: "asc" },
        select: {
          guestPassesDeducted: true,
          sessionsDeducted: true,
          sessionChange: {
            select: { reason: true },
          },
          customerPackage: {
            select: {
              membershipName: true,
              package: {
                select: {
                  name: true,
                },
              },
              services: {
                select: {
                  id: true,
                  initialSessions: true,
                  remainingSessions: true,
                  serviceName: true,
                },
              },
            },
          },
        },
      },
    },
    ...(options.take ? { take: options.take } : {}),
    where,
  });

  return visits.map((visit) => ({
    checkedInAt: visit.checkedInAt,
    checkedOutAt: visit.checkedOutAt,
    guestCountUsed: visit.guestCountUsed,
    id: visit.id,
    occupancyDelta: Math.max(1, visit.occupancyDelta),
    packageUsages: visit.packageUsages.map((usage) => {
      const serviceReference = serviceReferenceFromReason(
        usage.sessionChange?.reason ?? null,
      );
      const service = serviceReference
        ? usage.customerPackage.services.find(
            (candidate) => candidate.id === serviceReference.id,
          )
        : null;

      return {
        guestPassesDeducted: usage.guestPassesDeducted,
        packageName: membershipDisplayName(usage.customerPackage),
        serviceInitialSessions: service?.initialSessions ?? null,
        serviceName: service?.serviceName ?? serviceReference?.name ?? null,
        serviceRemainingSessions: service?.remainingSessions ?? null,
        sessionsDeducted: usage.sessionsDeducted,
      };
    }),
  }));
}
