export type HourlyCheckIns = {
  count: number;
  hour: number;
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

function hourLabel(hour: number) {
  const nextHour = (hour + 1) % 24;

  return `${hour.toString().padStart(2, "0")}:00–${nextHour
    .toString()
    .padStart(2, "0")}:00`;
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
