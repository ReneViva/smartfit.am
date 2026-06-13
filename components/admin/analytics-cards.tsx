import type { HourlyCheckIns } from "../../lib/analytics/basic";
import { Card } from "../ui/card";

export function AnalyticsCards({
  currentOccupancy,
  peakHours,
  todayCheckIns,
}: {
  currentOccupancy: number;
  peakHours: HourlyCheckIns[];
  todayCheckIns: number;
}) {
  const topHours = peakHours.filter((hour) => hour.isPeak);
  const peakValue = topHours[0]?.count ?? 0;
  const peakLabel = topHours.length
    ? topHours.map((hour) => hour.label).join(", ")
    : "No check-ins yet";
  const cards = [
    {
      detail: "People currently inside",
      label: "Current occupancy",
      value: currentOccupancy,
    },
    {
      detail: "Visits checked in during the current server-local day",
      label: "Today's check-ins",
      value: todayCheckIns,
    },
    {
      detail: peakLabel,
      label: topHours.length > 1 ? "Peak hours" : "Peak hour",
      value: peakValue,
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <p className="text-sm font-semibold text-secondary">{card.label}</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-foreground">
            {card.value}
          </p>
          <p className="mt-2 break-words text-sm leading-6 text-secondary">
            {card.detail}
          </p>
        </Card>
      ))}
    </div>
  );
}
