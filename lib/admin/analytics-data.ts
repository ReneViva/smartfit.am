import { getServerLocalDayRange, groupCheckInsByHour } from "../analytics/basic";
import { db } from "../db";

export async function getBasicAnalytics(now = new Date()) {
  const { end, start } = getServerLocalDayRange(now);
  const [occupancy, visits] = await Promise.all([
    db.occupancyState.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { currentCount: true, updatedAt: true },
    }),
    db.gymVisit.findMany({
      orderBy: { checkedInAt: "asc" },
      select: { checkedInAt: true },
      where: {
        checkedInAt: {
          gte: start,
          lt: end,
        },
      },
    }),
  ]);
  const peakHours = groupCheckInsByHour(
    visits.map((visit) => visit.checkedInAt),
  );

  return {
    currentOccupancy: Math.max(0, occupancy?.currentCount ?? 0),
    occupancyUpdatedAt: occupancy?.updatedAt ?? null,
    peakHours,
    todayCheckIns: visits.length,
    todayLabel: new Intl.DateTimeFormat("en", {
      dateStyle: "long",
    }).format(start),
  };
}
