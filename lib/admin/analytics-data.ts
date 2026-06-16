import {
  getServerLocalWeekRange,
  groupOccupancyEventsByDay,
} from "../analytics/basic";
import { getVisitAnalytics } from "../analytics/data";
import { db } from "../db";

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

  return {
    ...activity,
    currentOccupancy: Math.max(0, occupancy?.currentCount ?? 0),
    occupancyTrend: groupOccupancyEventsByDay(
      occupancyEvents,
      weekRange.start,
    ),
    occupancyUpdatedAt: occupancy?.updatedAt ?? null,
  };
}
