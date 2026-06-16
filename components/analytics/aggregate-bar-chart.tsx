import { Card } from "../ui/card";

type BarDatum = {
  hasData?: boolean;
  isPeak?: boolean;
  label: string;
  value: number;
};

type AggregateBarChartProps = {
  data: BarDatum[];
  description: string;
  emptyMessage: string;
  eyebrow: string;
  title: string;
  valueLabel: string;
};

export function AggregateBarChart({
  data,
  description,
  emptyMessage,
  eyebrow,
  title,
  valueLabel,
}: AggregateBarChartProps) {
  const hasData = data.some((point) => point.hasData ?? point.value > 0);
  const maximum = Math.max(1, ...data.map((point) => point.value));

  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-2xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-secondary">{description}</p>

      {hasData ? (
        <div
          aria-label={`${title}. ${description}`}
          className="mt-6 space-y-4"
          role="img"
        >
          {data.map((point) => (
            <div
              className="grid min-w-0 grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3"
              key={point.label}
            >
              <span className="text-sm font-semibold text-secondary">
                {point.label}
              </span>
              <div className="h-3 min-w-0 overflow-hidden rounded-full bg-neutral">
                <div
                  className={`h-full rounded-full ${
                    point.isPeak ? "bg-brand" : "bg-status-active"
                  }`}
                  style={{ width: `${(point.value / maximum) * 100}%` }}
                />
              </div>
              <span className="min-w-16 text-right text-sm font-bold text-foreground">
                {point.hasData === false
                  ? "-"
                  : `${point.value} ${valueLabel}`}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-page px-5 py-10 text-center text-secondary">
          {emptyMessage}
        </p>
      )}
    </Card>
  );
}
