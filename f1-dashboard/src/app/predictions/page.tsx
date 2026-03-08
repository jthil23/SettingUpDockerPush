import { prisma } from "@/lib/prisma";
import PredictionsClient from "@/components/predictions/PredictionsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Predictions | F1 Dashboard",
  description: "Predict race winners and track your accuracy",
};

export default async function PredictionsPage() {
  const currentYear = new Date().getFullYear();

  const [races, predictions, drivers] = await Promise.all([
    prisma.race.findMany({
      where: { season: currentYear },
      orderBy: { round: "asc" },
      select: {
        id: true,
        round: true,
        raceName: true,
        date: true,
        time: true,
        results: {
          orderBy: { position: "asc" },
          take: 3,
          select: {
            position: true,
            driverId: true,
            constructor: false,
            driver: {
              select: {
                driverId: true,
                firstName: true,
                lastName: true,
                code: true,
              },
            },
          },
        },
      },
    }),
    prisma.prediction.findMany({
      where: { race: { season: currentYear } },
      include: {
        race: {
          select: {
            id: true,
            round: true,
            raceName: true,
            date: true,
          },
        },
      },
      orderBy: { race: { round: "asc" } },
    }),
    prisma.driver.findMany({
      where: {
        OR: [
          { results: { some: { race: { season: { gte: currentYear - 1 } } } } },
          { qualifyingResults: { some: { race: { season: currentYear } } } },
        ],
      },
      select: {
        driverId: true,
        firstName: true,
        lastName: true,
        code: true,
      },
      orderBy: { lastName: "asc" },
    }),
  ]);

  // Get fastest lap info for scored races
  const raceIdsWithResults = races
    .filter((r) => r.results.length > 0)
    .map((r) => r.id);

  const fastestLaps = await prisma.result.findMany({
    where: {
      raceId: { in: raceIdsWithResults },
      fastestLapRank: 1,
    },
    select: {
      raceId: true,
      driverId: true,
      constructor: false,
      driver: {
        select: {
          driverId: true,
          firstName: true,
          lastName: true,
          code: true,
        },
      },
    },
  });

  const fastestLapMap: Record<
    number,
    { driverId: string; firstName: string; lastName: string; code: string | null }
  > = {};
  for (const fl of fastestLaps) {
    fastestLapMap[fl.raceId] = fl.driver;
  }

  // Serialize dates
  const serializedRaces = races.map((r) => ({
    ...r,
    date: r.date.toISOString(),
  }));

  const serializedPredictions = predictions.map((p) => ({
    ...p,
    predictedPodium: p.predictedPodium as string[],
    actualPodium: p.actualPodium as string[] | null,
    createdAt: p.createdAt.toISOString(),
    race: {
      ...p.race,
      date: p.race.date.toISOString(),
    },
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white">
          {currentYear} Race Predictions
        </h1>
      </div>

      <PredictionsClient
        races={serializedRaces}
        predictions={serializedPredictions}
        drivers={drivers}
        fastestLapMap={fastestLapMap}
      />
    </div>
  );
}
