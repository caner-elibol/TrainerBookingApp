import Skeleton from "@/components/ui/Skeleton";
import StatCardSkeleton from "@/components/ui/StatCardSkeleton";
import { CARD_BASE_CLASSES } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className={CARD_BASE_CLASSES}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-[72px] w-[72px] rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
        </div>
      </div>

      <div className={CARD_BASE_CLASSES}>
        <Skeleton className="h-5 w-16" />
        <div className="mt-3 flex flex-col gap-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    </div>
  );
}
