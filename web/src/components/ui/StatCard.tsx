import type { ComponentType, ReactNode } from "react";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { CARD_BASE_CLASSES } from "./Card";

export interface StatCardDelta {
  label: string;
  direction: "up" | "down";
}

export type StatCardTone = "primary" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<StatCardTone, string> = {
  primary: "bg-subtle text-ink",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-error-50 text-error-600",
};

export interface StatCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  delta?: StatCardDelta;
  caption?: ReactNode;
  showChevron?: boolean;
  tone?: StatCardTone;
  className?: string;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  caption,
  showChevron,
  tone = "primary",
  className,
}: StatCardProps) {
  return (
    <div className={cn(CARD_BASE_CLASSES, "flex min-w-0 flex-col gap-2.5 p-4 md:gap-3 md:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md md:h-10 md:w-10", TONE_CLASSES[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        {delta && (
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 text-xs font-semibold",
              delta.direction === "up" ? "text-success-600" : "text-error-600",
            )}
          >
            {delta.direction === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {delta.label}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-ink-secondary md:text-sm">{label}</p>
        <p className="mt-1 line-clamp-2 text-xl font-bold break-words text-foreground md:text-2xl">{value}</p>
      </div>
      {(caption || showChevron) && (
        <div className="flex items-center justify-between gap-2 text-xs text-ink-secondary">
          <div className="min-w-0">{caption}</div>
          {showChevron && <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />}
        </div>
      )}
    </div>
  );
}
