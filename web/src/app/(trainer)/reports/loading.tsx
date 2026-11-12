import PageHeaderSkeleton from "@/components/ui/PageHeaderSkeleton";
import StatCardSkeleton from "@/components/ui/StatCardSkeleton";
import ChartSkeleton from "@/components/ui/ChartSkeleton";
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
        <ChartSkeleton />
      </div>
      <div className={CARD_BASE_CLASSES}>
        <ChartSkeleton height={140} />
      </div>
    </div>
  );
}
