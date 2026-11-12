import PageHeaderSkeleton from "@/components/ui/PageHeaderSkeleton";
import StatCardSkeleton from "@/components/ui/StatCardSkeleton";
import AppointmentCardSkeleton from "@/components/ui/AppointmentCardSkeleton";
import Skeleton from "@/components/ui/Skeleton";
import { CARD_BASE_CLASSES } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />

      <div className="grid grid-cols-2 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className={CARD_BASE_CLASSES}>
        <Skeleton className="h-5 w-40" />
        <div className="mt-4 flex flex-col gap-3">
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
        </div>
      </div>

      <Skeleton className="h-28 w-full rounded-2xl" />

      <div className={CARD_BASE_CLASSES}>
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
