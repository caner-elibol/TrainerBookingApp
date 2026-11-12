import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  percent: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
}

export default function ProgressBar({ percent, className, trackClassName, fillClassName }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-muted", trackClassName, className)}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-[width]", fillClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
