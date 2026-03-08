import { prisma } from "@/lib/prisma";
import ResultsClient from "@/components/results/ResultsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Race Results | F1 Dashboard",
  description: "Detailed race and qualifying results with position changes",
};

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonParam } = await searchParams;

  // Get all seasons that have result data
  const seasonsRaw = await prisma.race.findMany({
    where: {
      OR: [
        { results: { some: {} } },
        { qualifyingResults: { some: {} } },
      ],
    },
    select: { season: true },
    distinct: ["season"],
    orderBy: { season: "desc" },
  });
  const availableSeasons = seasonsRaw.map((r) => r.season);

  const selectedSeason = seasonParam
    ? parseInt(seasonParam, 10)
    : availableSeasons[0] ?? new Date().getFullYear();

  // Get all races that have results OR qualifying results
  const racesWithData = await prisma.race.findMany({
    where: {
      season: selectedSeason,
      OR: [
        { results: { some: {} } },
        { qualifyingResults: { some: {} } },
      ],
    },
    include: {
      circuit: true,
    },
    orderBy: { round: "desc" },
  });

  // Build race options for the selector
  const raceOptions = racesWithData.map((race) => ({
    id: race.id,
    round: race.round,
    season: race.season,
    raceName: race.raceName,
    country: race.circuit.country,
  }));

  // Default to most recent race with data (first in desc order)
  const defaultRace = racesWithData[0] ?? null;
  let defaultResults: Record<string, unknown>[] = [];
  let defaultQualifying: Record<string, unknown>[] = [];

  if (defaultRace) {
    const [results, qualifying] = await Promise.all([
      prisma.result.findMany({
        where: { raceId: defaultRace.id },
        include: {
          driver: true,
          constructor: true,
        },
        orderBy: [
          { position: { sort: "asc", nulls: "last" } },
          { grid: "asc" },
        ],
      }),
      prisma.qualifyingResult.findMany({
        where: { raceId: defaultRace.id },
        include: {
          driver: true,
          constructor: true,
        },
        orderBy: [
          { position: { sort: "asc", nulls: "last" } },
        ],
      }),
    ]);

    // Serialize dates for client transport
    defaultResults = results.map((r) => ({
      ...r,
      driver: {
        ...r.driver,
        dob: r.driver.dob instanceof Date ? r.driver.dob.toISOString() : (r.driver.dob ?? null),
      },
    })) as unknown as Record<string, unknown>[];

    defaultQualifying = qualifying.map((q) => ({
      ...q,
      driver: {
        ...q.driver,
        dob: q.driver.dob instanceof Date ? q.driver.dob.toISOString() : (q.driver.dob ?? null),
      },
    })) as unknown as Record<string, unknown>[];
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white">
        Race Results
      </h1>

      <ResultsClient
        races={raceOptions}
        defaultRaceId={defaultRace?.id ?? null}
        defaultResults={defaultResults}
        defaultQualifying={defaultQualifying}
        availableSeasons={availableSeasons}
        selectedSeason={selectedSeason}
      />
    </div>
  );
}
