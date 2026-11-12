import type { ReactNode } from "react";
import DonutChart, { type DonutSegment } from "./DonutChart";
import { cn } from "@/lib/cn";

export interface DonutChartWithLegendProps {
  data: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  formatLegendValue?: (segment: DonutSegment, total: number) => ReactNode;
  className?: string;
}

export default function DonutChartWithLegend({
  data,
  centerLabel,
  centerValue,
  size,
  formatLegendValue,
  className,
}: DonutChartWithLegendProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <DonutChart data={data} size={size} centerLabel={centerLabel} centerValue={centerValue} />
      <div className="flex w-full flex-col gap-2.5">
        {data.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 flex-1 items-center gap-2 text-ink-secondary">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="shrink-0 font-semibold text-foreground">
              {formatLegendValue ? formatLegendValue(segment, total) : segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
