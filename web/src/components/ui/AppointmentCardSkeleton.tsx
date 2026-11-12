import Skeleton from "./Skeleton";

export default function AppointmentCardSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-4 w-10 shrink-0 self-start" />
      <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-border-default p-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-1.5 h-3 w-36" />
        </div>
        <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
