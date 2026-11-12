import { CHART_PRIMARY } from "@/lib/chart-colors";

export interface LineChartPoint {
  label: string;
  value: number;
}

export interface LineChartMiniProps {
  data: LineChartPoint[];
  height?: number;
  color?: string;
  formatValue?: (value: number) => string;
  highlightIndex?: number;
}

export default function LineChartMini({
  data,
  height = 200,
  color = CHART_PRIMARY,
  formatValue = (v) => String(v),
  highlightIndex,
}: LineChartMiniProps) {
  const width = 600;
  const padding = 16;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(0, ...data.map((d) => d.value));
  const range = max - min || 1;
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: padding + (height - padding * 2) * (1 - (d.value - min) / range),
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${height - padding} L ${points[0]?.x ?? 0} ${height - padding} Z`;

  const activeIndex = highlightIndex ?? points.length - 1;
  const active = points[activeIndex];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#lineChartFill)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r={p === active ? 5 : 3.5} fill={color} stroke="white" strokeWidth={2} />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-ink-muted">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
      {active && (
        <div className="relative">
          <div
            className="pointer-events-none absolute -top-[calc(100%+1.75rem)] rounded-lg border border-border-default bg-surface px-3 py-2 text-xs whitespace-nowrap shadow-card-hover"
            style={{
              left: `${Math.min(92, Math.max(8, (active.x / width) * 100))}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-ink-secondary">{active.label}</p>
            <p className="font-bold text-foreground">{formatValue(active.value)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
