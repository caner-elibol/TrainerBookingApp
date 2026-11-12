import Skeleton from "./Skeleton";

export default function PageHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <Skeleton className="h-9 w-24 shrink-0 rounded-md" />
    </div>
  );
}
