import { prisma } from "@/lib/prisma";
import AdminClient from "@/components/admin/AdminClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | F1 Dashboard",
  description: "API status, database stats, and sync controls",
};

export default async function AdminPage() {
  const currentYear = new Date().getFullYear();

  // Get database counts
  const [
    seasons,
    circuits,
    races,
    drivers,
    constructors,
    results,
    qualifyingResults,
    predictions,
  ] = await Promise.all([
    prisma.season.count(),
    prisma.circuit.count(),
    prisma.race.count(),
    prisma.driver.count(),
    prisma.constructor.count(),
    prisma.result.count(),
    prisma.qualifyingResult.count(),
    prisma.prediction.count(),
  ]);

  // Get recent sync logs
  const recentSyncs = await prisma.syncLog.findMany({
    orderBy: { lastSynced: "desc" },
    take: 25,
  });

  // Get races for the results sync selector
  const currentRaces = await prisma.race.findMany({
    where: { season: currentYear },
    orderBy: { round: "asc" },
    select: { round: true, raceName: true },
  });

  return (
    <AdminClient
      dbStats={{
        seasons,
        circuits,
        races,
        drivers,
        constructors,
        results,
        qualifyingResults,
        predictions,
      }}
      recentSyncs={recentSyncs.map((s) => ({
        id: s.id,
        entity: s.entity,
        status: s.status,
        recordsUpdated: s.recordsUpdated,
        lastSynced: s.lastSynced.toISOString(),
      }))}
      currentYear={currentYear}
      races={currentRaces}
    />
  );
}
