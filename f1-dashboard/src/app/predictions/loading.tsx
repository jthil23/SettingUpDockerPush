import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function PredictionsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <Skeleton className="h-8 w-56" />

      {/* Accuracy stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Prediction form / results */}
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
