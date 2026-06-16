export type HourlyCheckIns = {
  count: number;
  hour: number;
  isPeak: boolean;
  label: string;
};

export type DailyCheckIns = {
  count: number;
  isPeak: boolean;
  label: string;
};

export type DailyOccupancyPeak = {
  count: number;
  hasData: boolean;
  isPeak: boolean;
  label: string;
};

export function getServerLocalDayRange(now = new Date()) {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );

  return { end, start };
}

export function getServerLocalWeekRange(now = new Date()) {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { end, start };
}

function hourLabel(hour: number) {
  const nextHour = (hour + 1) % 24;

  return `${hour.toString().padStart(2, "0")}:00-${nextHour
    .toString()
    .padStart(2, "0")}:00`;
}

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

function weekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);

    return {
      key: localDateKey(date),
      label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
    };
  });
}

export function groupCheckInsByHour(checkIns: Date[]): HourlyCheckIns[] {
  const counts = new Map<number, number>();

  for (const checkIn of checkIns) {
    const hour = checkIn.getHours();
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }

  const peakCount = Math.max(0, ...counts.values());

  return [...counts.entries()]
    .sort(([leftHour], [rightHour]) => leftHour - rightHour)
    .map(([hour, count]) => ({
      count,
      hour,
      isPeak: count === peakCount,
      label: hourLabel(hour),
    }));
}

export function groupCheckInsByDay(
  checkIns: Date[],
  weekStart: Date,
): DailyCheckIns[] {
  const counts = new Map<string, number>();

  for (const checkIn of checkIns) {
    const key = localDateKey(checkIn);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const days = weekDays(weekStart);
  const peakCount = Math.max(
    0,
    ...days.map(({ key }) => counts.get(key) ?? 0),
  );

  return days.map(({ key, label }) => {
    const count = counts.get(key) ?? 0;

    return {
      count,
      isPeak: peakCount > 0 && count === peakCount,
      label,
    };
  });
}

export function groupOccupancyEventsByDay(
  events: { createdAt: Date; newCount: number }[],
  weekStart: Date,
): DailyOccupancyPeak[] {
  const peaks = new Map<string, number>();

  for (const event of events) {
    const key = localDateKey(event.createdAt);
    peaks.set(key, Math.max(peaks.get(key) ?? 0, event.newCount));
  }

  const days = weekDays(weekStart);
  const peakCount = Math.max(
    0,
    ...days.flatMap(({ key }) => (peaks.has(key) ? [peaks.get(key) ?? 0] : [])),
  );

  return days.map(({ key, label }) => {
    const hasData = peaks.has(key);
    const count = peaks.get(key) ?? 0;

    return {
      count,
      hasData,
      isPeak: hasData && count === peakCount,
      label,
    };
  });
}
