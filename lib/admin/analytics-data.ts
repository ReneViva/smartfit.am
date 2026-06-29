import {
  getServerLocalWeekRange,
  groupOccupancyEventsByDay,
} from "../analytics/basic";
import { getVisitAnalytics } from "../analytics/data";
import {
  membershipDisplayName,
  personDisplayName,
  serviceLineCoachDisplayName,
} from "../customer-memberships";
import { db } from "../db";

const SERVICE_DEDUCTION_REASON_PREFIX = "Service check-in deduction:";

function serviceIdFromReason(reason: string | null) {
  return reason?.match(/\[service:([^\]]+)\]$/)?.[1] ?? null;
}

function serviceNameFromReason(reason: string | null) {
  if (!reason?.startsWith(SERVICE_DEDUCTION_REASON_PREFIX)) {
    return null;
  }

  return reason
    .slice(SERVICE_DEDUCTION_REASON_PREFIX.length)
    .replace(/\s+\[service:[^\]]+\]$/, "")
    .trim();
}

function topCounts(counts: Map<string, number>) {
  const peak = Math.max(0, ...counts.values());

  return [...counts.entries()]
    .sort(
      ([leftLabel, leftCount], [rightLabel, rightCount]) =>
        rightCount - leftCount || leftLabel.localeCompare(rightLabel),
    )
    .slice(0, 5)
    .map(([label, count]) => ({
      count,
      isPeak: peak > 0 && count === peak,
      label,
    }));
}

async function getServiceDeductionAnalytics(weekRange: {
  end: Date;
  start: Date;
}) {
  const sessionChanges = await db.packageSessionChange.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      customerPackage: {
        select: {
          coach: { select: { firstName: true, lastName: true } },
          membershipName: true,
          package: {
            select: {
              assignedCoach: { select: { firstName: true, lastName: true } },
              name: true,
            },
          },
        },
      },
      delta: true,
      reason: true,
    },
    where: {
      changeType: "CHECK_IN_DEDUCTION",
      createdAt: {
        gte: weekRange.start,
        lt: weekRange.end,
      },
      delta: { lt: 0 },
    },
  });
  const serviceIds = [
    ...new Set(
      sessionChanges
        .map((change) => serviceIdFromReason(change.reason))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const services = await db.customerPackageService.findMany({
    select: {
      coach: { select: { firstName: true, lastName: true } },
      coachName: true,
      id: true,
      serviceName: true,
    },
    where: { id: { in: serviceIds } },
  });
  const servicesById = new Map(services.map((service) => [service.id, service]));
  const serviceCounts = new Map<string, number>();
  const coachCounts = new Map<string, number>();
  let totalSessionsUsed = 0;

  for (const change of sessionChanges) {
    const amount = Math.abs(change.delta);
    const serviceId = serviceIdFromReason(change.reason);
    const service = serviceId ? servicesById.get(serviceId) : null;
    const serviceLabel =
      service?.serviceName ??
      serviceNameFromReason(change.reason) ??
      membershipDisplayName(change.customerPackage);
    const coachLabel =
      serviceLineCoachDisplayName(service ?? {}) ??
      personDisplayName(change.customerPackage.coach) ??
      personDisplayName(change.customerPackage.package?.assignedCoach) ??
      "No coach/person assigned";

    totalSessionsUsed += amount;
    serviceCounts.set(serviceLabel, (serviceCounts.get(serviceLabel) ?? 0) + amount);
    coachCounts.set(coachLabel, (coachCounts.get(coachLabel) ?? 0) + amount);
  }

  return {
    topCoaches: topCounts(coachCounts),
    topServices: topCounts(serviceCounts),
    totalSessionsUsed,
  };
}

export async function getBasicAnalytics(now = new Date()) {
  const weekRange = getServerLocalWeekRange(now);
  const [activity, occupancy, occupancyEvents] = await Promise.all([
    getVisitAnalytics(now),
    db.occupancyState.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { currentCount: true, updatedAt: true },
    }),
    db.occupancyEvent.findMany({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, newCount: true },
      where: {
        createdAt: {
          gte: weekRange.start,
          lt: weekRange.end,
        },
      },
    }),
  ]);
  const serviceDeductions = await getServiceDeductionAnalytics(weekRange);

  return {
    ...activity,
    currentOccupancy: Math.max(0, occupancy?.currentCount ?? 0),
    occupancyTrend: groupOccupancyEventsByDay(
      occupancyEvents,
      weekRange.start,
    ),
    occupancyUpdatedAt: occupancy?.updatedAt ?? null,
    serviceDeductions,
  };
}
