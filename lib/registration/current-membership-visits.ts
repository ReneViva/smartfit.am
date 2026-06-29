import "server-only";

import type { Prisma } from "@prisma/client";

import { requireStaffUser } from "../auth";
import { membershipDisplayName } from "../customer-memberships";
import { db } from "../db";

export type RegistrationCurrentMembershipVisitSummary = {
  membershipName: string;
  totalVisits: number;
  visits: {
    checkedInAt: Date;
    checkedOutAt: Date | null;
    id: string;
    serviceSummaries: string[];
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

export async function getRegistrationCurrentMembershipVisitSummary(
  customerId: string,
): Promise<RegistrationCurrentMembershipVisitSummary | null> {
  await requireStaffUser();

  const membership = await db.customerPackage.findFirst({
    orderBy: [{ activationDate: "desc" }, { createdAt: "desc" }],
    select: {
      activationDate: true,
      expirationDate: true,
      id: true,
      membershipName: true,
      package: { select: { name: true } },
    },
    where: {
      customerId,
      deletedAt: null,
      status: "ACTIVE",
    },
  });

  if (!membership) {
    return null;
  }

  const where: Prisma.GymVisitWhereInput = {
    customerId,
    OR: [
      { packageUsages: { some: { customerPackageId: membership.id } } },
      {
        checkedInAt: {
          gte: membership.activationDate,
          lt: addDays(membership.expirationDate, 1),
        },
      },
    ],
  };

  const [totalVisits, visits] = await Promise.all([
    db.gymVisit.count({ where }),
    db.gymVisit.findMany({
      orderBy: [{ checkedInAt: "desc" }, { id: "desc" }],
      select: {
        checkedInAt: true,
        checkedOutAt: true,
        id: true,
        packageUsages: {
          orderBy: { createdAt: "asc" },
          select: {
            guestPassesDeducted: true,
            sessionsDeducted: true,
            sessionChange: { select: { reason: true } },
            customerPackage: {
              select: {
                membershipName: true,
                package: { select: { name: true } },
                services: {
                  select: {
                    id: true,
                    initialSessions: true,
                    serviceName: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 3,
      where,
    }),
  ]);

  return {
    membershipName: membershipDisplayName(membership),
    totalVisits,
    visits: visits.map((visit) => ({
      checkedInAt: visit.checkedInAt,
      checkedOutAt: visit.checkedOutAt,
      id: visit.id,
      serviceSummaries: visit.packageUsages.length
        ? visit.packageUsages.map((usage) => {
            const serviceReference = serviceReferenceFromReason(
              usage.sessionChange?.reason ?? null,
            );
            const service = serviceReference
              ? usage.customerPackage.services.find(
                  (candidate) => candidate.id === serviceReference.id,
                )
              : null;
            const serviceName =
              service?.serviceName ??
              serviceReference?.name ??
              membershipDisplayName(usage.customerPackage);
            const guestText = usage.guestPassesDeducted
              ? `, ${usage.guestPassesDeducted} guest pass${
                  usage.guestPassesDeducted === 1 ? "" : "es"
                }`
              : "";

            if (usage.sessionsDeducted && service?.initialSessions) {
              return `${serviceName}: ${usage.sessionsDeducted} used / ${service.initialSessions} total${guestText}`;
            }

            if (usage.sessionsDeducted) {
              return `${serviceName}: ${usage.sessionsDeducted} service session${
                usage.sessionsDeducted === 1 ? "" : "s"
              } used${guestText}`;
            }

            return `${serviceName}: No service deduction${guestText}`;
          })
        : ["No service deduction recorded"],
    })),
  };
}
