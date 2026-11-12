import PageHeaderSkeleton from "@/components/ui/PageHeaderSkeleton";
import CalendarSkeleton from "@/components/ui/CalendarSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <CalendarSkeleton />
    </div>
  );
}
