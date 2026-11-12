import PageHeaderSkeleton from "@/components/ui/PageHeaderSkeleton";
import AppointmentCardSkeleton from "@/components/ui/AppointmentCardSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <AppointmentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
