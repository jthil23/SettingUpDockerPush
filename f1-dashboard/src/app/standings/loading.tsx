import { Skeleton } from "@/components/ui/Skeleton";

export default function StandingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <Skeleton className="h-8 w-64" />

      {/* Toggle tabs */}
      <Skeleton className="h-10 w-56" />

      {/* Standings table skeleton */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-f1-carbon">
          <Skeleton className="h-4 w-full" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-f1-carbon/50">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-12 ml-auto" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="card">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
