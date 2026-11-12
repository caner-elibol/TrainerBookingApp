import Skeleton from "./Skeleton";
import { cn } from "@/lib/cn";

export default function ChartSkeleton({ height = 180, className }: { height?: number; className?: string }) {
  return (
    <div className={cn("flex items-end gap-3", className)} style={{ height }}>
      {[45, 70, 55, 90, 65, 80, 50].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
