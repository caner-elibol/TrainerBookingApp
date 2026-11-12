import { CARD_BASE_CLASSES } from "./Card";
import Skeleton from "./Skeleton";
import { cn } from "@/lib/cn";

export default function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(CARD_BASE_CLASSES, "flex flex-col gap-3 p-5", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-4 w-10 rounded-full" />
      </div>
      <div>
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="mt-2 h-7 w-16" />
      </div>
    </div>
  );
}
