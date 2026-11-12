import PageHeaderSkeleton from "@/components/ui/PageHeaderSkeleton";
import Skeleton from "@/components/ui/Skeleton";
import { CARD_BASE_CLASSES } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className={CARD_BASE_CLASSES}>
        <Skeleton className="h-4 w-16" />
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className={CARD_BASE_CLASSES}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
