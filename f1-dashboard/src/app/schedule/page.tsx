import { prisma } from "@/lib/prisma";
import ScheduleGrid from "@/components/schedule/ScheduleGrid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Season Schedule | F1 Dashboard",
  description: "Full season calendar with race weekends, session times, and results",
};

export default async function SchedulePage() {
  const now = new Date();
  const currentYear = now.getFullYear();

  const races = await prisma.race.findMany({
    where: { season: currentYear },
    include: {
      circuit: true,
      results: {
        where: { position: 1 },
        include: {
          driver: true,
          constructor: true,
        },
        take: 1,
      },
    },
    orderBy: { round: "asc" },
  });

  // Serialize dates to ISO strings for client components
  const serializedRaces = races.map((race) => {
    const winner =
      race.results.length > 0
        ? {
            firstName: race.results[0].driver.firstName,
            lastName: race.results[0].driver.lastName,
            constructorName: race.results[0].constructor.name,
          }
        : null;

    return {
      id: race.id,
      round: race.round,
      raceName: race.raceName,
      circuitId: race.circuitId,
      date: race.date.toISOString().split("T")[0],
      time: race.time,
      fp1Date: race.fp1Date?.toISOString().split("T")[0] ?? null,
      fp1Time: race.fp1Time,
      fp2Date: race.fp2Date?.toISOString().split("T")[0] ?? null,
      fp2Time: race.fp2Time,
      fp3Date: race.fp3Date?.toISOString().split("T")[0] ?? null,
      fp3Time: race.fp3Time,
      qualiDate: race.qualiDate?.toISOString().split("T")[0] ?? null,
      qualiTime: race.qualiTime,
      sprintDate: race.sprintDate?.toISOString().split("T")[0] ?? null,
      sprintTime: race.sprintTime,
      circuit: {
        name: race.circuit.name,
        location: race.circuit.location,
        country: race.circuit.country,
      },
      winner,
    };
  });

  // Group: past (have results/winner), future (rest)
  // The first race without a winner is the "next" race
  const pastRaces = serializedRaces.filter((r) => r.winner !== null);
  const upcomingRaces = serializedRaces.filter((r) => r.winner === null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white">
          {currentYear} Season Schedule
        </h1>
        <span className="text-sm text-f1-white/40 font-mono">
          {pastRaces.length}/{serializedRaces.length} completed
        </span>
      </div>

      {serializedRaces.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <p className="text-f1-white/40 text-lg mb-2">No races synced yet</p>
          <p className="text-f1-white/25 text-sm">
            Race data will appear here once the schedule has been synced.
          </p>
        </div>
      ) : (
        <ScheduleGrid
          pastRaces={pastRaces}
          upcomingRaces={upcomingRaces}
        />
      )}
    </div>
  );
}
