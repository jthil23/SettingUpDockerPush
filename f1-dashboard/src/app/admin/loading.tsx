import { CardSkeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="animate-pulse bg-f1-carbon rounded h-8 w-48" />
      </div>

      {/* API status skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card animate-pulse space-y-3">
          <div className="bg-f1-carbon rounded h-5 w-24" />
          <div className="bg-f1-carbon rounded h-8 w-16" />
        </div>
        <div className="card animate-pulse space-y-3">
          <div className="bg-f1-carbon rounded h-5 w-24" />
          <div className="bg-f1-carbon rounded h-8 w-16" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card animate-pulse space-y-2">
            <div className="bg-f1-carbon rounded h-4 w-16" />
            <div className="bg-f1-carbon rounded h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Sync controls & log skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
