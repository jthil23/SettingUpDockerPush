import { CardSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero countdown skeleton */}
      <div className="card space-y-4">
        <div className="animate-pulse bg-f1-carbon rounded h-8 w-1/2" />
        <div className="animate-pulse bg-f1-carbon rounded h-6 w-1/3" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-f1-carbon rounded h-16 w-20" />
          ))}
        </div>
      </div>

      {/* Standings grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Recent result skeleton */}
      <CardSkeleton />
    </div>
  );
}
