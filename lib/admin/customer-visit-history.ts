import "server-only";

import { requireStaffRole } from "../auth";
import { db } from "../db";

export type CustomerVisitHistoryItem = {
  checkedInAt: Date;
  checkedOutAt: Date | null;
  guestCountUsed: number;
  id: string;
  occupancyDelta: number;
  packageUsages: {
    guestPassesDeducted: number;
    packageName: string;
    sessionsDeducted: number;
  }[];
};

export async function getCustomerVisitHistoryForAdmin(
  customerId: string,
  options: { take?: number } = {},
): Promise<CustomerVisitHistoryItem[]> {
  await requireStaffRole("ADMIN");

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
          customerPackage: {
            select: {
              package: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    ...(options.take ? { take: options.take } : {}),
    where: { customerId },
  });

  return visits.map((visit) => ({
    checkedInAt: visit.checkedInAt,
    checkedOutAt: visit.checkedOutAt,
    guestCountUsed: visit.guestCountUsed,
    id: visit.id,
    occupancyDelta: Math.max(1, visit.occupancyDelta),
    packageUsages: visit.packageUsages.map((usage) => ({
      guestPassesDeducted: usage.guestPassesDeducted,
      packageName: usage.customerPackage.package.name,
      sessionsDeducted: usage.sessionsDeducted,
    })),
  }));
}
