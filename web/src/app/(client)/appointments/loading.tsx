import PageHeaderSkeleton from "@/components/ui/PageHeaderSkeleton";
import AppointmentCardSkeleton from "@/components/ui/AppointmentCardSkeleton";
import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <AppointmentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
