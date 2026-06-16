import {
  getServerLocalDayRange,
  getServerLocalWeekRange,
  groupCheckInsByDay,
  groupCheckInsByHour,
} from "./basic";
import { db } from "../db";

function formatRange(start: Date, end: Date) {
  const finalDay = new Date(end);
  finalDay.setDate(end.getDate() - 1);

  const format = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  });

  return `${format.format(start)} - ${format.format(finalDay)}`;
}

export async function getVisitAnalytics(now = new Date()) {
  const dayRange = getServerLocalDayRange(now);
  const weekRange = getServerLocalWeekRange(now);
  const visits = await db.gymVisit.findMany({
    orderBy: { checkedInAt: "asc" },
    select: { checkedInAt: true },
    where: {
      checkedInAt: {
        gte: weekRange.start,
        lt: weekRange.end,
      },
    },
  });
  const weeklyCheckInDates = visits.map((visit) => visit.checkedInAt);
  const todayCheckInDates = weeklyCheckInDates.filter(
    (checkedInAt) =>
      checkedInAt >= dayRange.start && checkedInAt < dayRange.end,
  );

  return {
    todayCheckIns: todayCheckInDates.length,
    todayHourlyCheckIns: groupCheckInsByHour(todayCheckInDates),
    todayLabel: new Intl.DateTimeFormat("en", {
      dateStyle: "long",
    }).format(dayRange.start),
    weekLabel: formatRange(weekRange.start, weekRange.end),
    weeklyCheckIns: groupCheckInsByDay(
      weeklyCheckInDates,
      weekRange.start,
    ),
    weeklyPeakHours: groupCheckInsByHour(weeklyCheckInDates),
    weeklyTotalCheckIns: weeklyCheckInDates.length,
  };
}

export async function getPublicVisitAnalytics(now = new Date()) {
  try {
    return await getVisitAnalytics(now);
  } catch {
    return null;
  }
}
