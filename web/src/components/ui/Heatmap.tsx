import { cn } from "@/lib/cn";

export interface HeatmapProps {
  rowLabels: string[];
  colLabels: string[];
  values: number[][];
  className?: string;
}

const INTENSITY_CLASSES = [
  "bg-surface-muted",
  "bg-subtle-strong",
  "bg-neutral-300",
  "bg-neutral-500",
  "bg-primary",
];

function intensityClass(value: number): string {
  const index = Math.min(INTENSITY_CLASSES.length - 1, Math.round(value * (INTENSITY_CLASSES.length - 1)));
  return INTENSITY_CLASSES[Math.max(0, index)];
}

export default function Heatmap({ rowLabels, colLabels, values, className }: HeatmapProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div
        className="grid w-full gap-y-2"
        style={{ gridTemplateColumns: `minmax(44px,auto) repeat(${colLabels.length}, minmax(0,1fr))` }}
      >
        <div />
        {colLabels.map((c) => (
          <span key={c} className="text-center text-xs font-medium text-ink-secondary">
            {c}
          </span>
        ))}
        {rowLabels.map((row, rowIndex) => (
          <div key={row} className="contents">
            <span className="flex items-center text-xs break-words whitespace-normal text-ink-secondary">{row}</span>
            {colLabels.map((col, colIndex) => (
              <div key={col} className="flex items-center justify-center px-1">
                <div
                  className={cn("h-6 w-full rounded-md", intensityClass(values[rowIndex]?.[colIndex] ?? 0))}
                  title={`${row} · ${col}`}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
