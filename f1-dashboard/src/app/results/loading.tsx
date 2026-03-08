import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

export default function ResultsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <Skeleton className="h-8 w-40" />

      {/* Race selector */}
      <Skeleton className="h-10 w-72" />

      {/* Toggle tabs */}
      <Skeleton className="h-10 w-48" />

      {/* Results table skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-f1-carbon">
              {["Pos", "Grid", "+/-", "Driver", "Team", "Pts"].map((h) => (
                <th key={h} className="py-3 px-3 text-left">
                  <Skeleton className="h-3 w-12" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={6} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
