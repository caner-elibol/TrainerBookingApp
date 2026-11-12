import Skeleton from "./Skeleton";

export default function ClientRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface p-3">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-1.5 h-3 w-40" />
        <Skeleton className="mt-1.5 h-3 w-28" />
      </div>
      <Skeleton className="h-4 w-4 shrink-0" />
    </div>
  );
}
