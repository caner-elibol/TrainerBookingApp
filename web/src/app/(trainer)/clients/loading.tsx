import PageHeaderSkeleton from "@/components/ui/PageHeaderSkeleton";
import StatCardSkeleton from "@/components/ui/StatCardSkeleton";
import ClientRowSkeleton from "@/components/ui/ClientRowSkeleton";
import Skeleton from "@/components/ui/Skeleton";

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

      <Skeleton className="h-10 w-full rounded-lg" />

      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <ClientRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
