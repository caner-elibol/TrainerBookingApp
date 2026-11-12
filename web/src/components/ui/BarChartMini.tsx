import { CHART_PRIMARY } from "@/lib/chart-colors";
import { cn } from "@/lib/cn";

export interface BarChartPoint {
  label: string;
  value: number;
}

export interface BarChartMiniProps {
  data: BarChartPoint[];
  height?: number;
  color?: string;
  className?: string;
}

export default function BarChartMini({ data, height = 180, color = CHART_PRIMARY, className }: BarChartMiniProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("flex items-stretch gap-3", className)} style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{d.value}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md"
              style={{ height: `${Math.max((d.value / max) * 100, 3)}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs text-ink-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
