import { prisma } from "@/lib/prisma";
import StandingsClient from "@/components/standings/StandingsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Standings | F1 Dashboard",
  description: "Championship standings with points progression charts",
};

export default async function StandingsPage() {
  const now = new Date();
  const currentYear = now.getFullYear();

  // ── Get all races this season that have standings, ordered by round ──
  const racesWithStandings = await prisma.race.findMany({
    where: {
      season: currentYear,
      driverStandings: { some: {} },
    },
    orderBy: { round: "asc" },
    select: { id: true, round: true, raceName: true },
  });

  const raceIds = racesWithStandings.map((r) => r.id);

  // ── Driver standings across all rounds ──
  const driverStandings = await prisma.driverStanding.findMany({
    where: { raceId: { in: raceIds } },
    include: {
      driver: {
        include: {
          results: {
            take: 1,
            orderBy: { id: "desc" },
            include: { constructor: true },
          },
        },
      },
      race: { select: { round: true, raceName: true } },
    },
    orderBy: [{ raceId: "asc" }, { position: "asc" }],
  });

  // ── Constructor standings across all rounds ──
  const constructorStandings = await prisma.constructorStanding.findMany({
    where: { raceId: { in: raceIds } },
    include: {
      constructor: true,
      race: { select: { round: true, raceName: true } },
    },
    orderBy: [{ raceId: "asc" }, { position: "asc" }],
  });

  // ── Get podium counts for drivers (position <= 3 in results this season) ──
  const podiumResults = await prisma.result.findMany({
    where: {
      race: { season: currentYear },
      position: { lte: 3 },
    },
  });

  const driverPodiums: Record<string, number> = {};
  const constructorPodiums: Record<string, number> = {};
  for (const r of podiumResults) {
    driverPodiums[r.driverId] = (driverPodiums[r.driverId] || 0) + 1;
    constructorPodiums[r.constructorId] =
      (constructorPodiums[r.constructorId] || 0) + 1;
  }

  // ── Build serialized driver standings (latest round for table) ──
  const latestRound = racesWithStandings[racesWithStandings.length - 1];
  const latestDriverStandings = latestRound
    ? driverStandings
        .filter((s) => s.race.round === latestRound.round)
        .map((s) => ({
          position: s.position,
          driverId: s.driverId,
          firstName: s.driver.firstName,
          lastName: s.driver.lastName,
          points: s.points,
          wins: s.wins,
          podiums: driverPodiums[s.driverId] || 0,
          color:
            s.driver.results[0]?.constructor?.colorPrimary ?? null,
          constructorName:
            s.driver.results[0]?.constructor?.name ?? "",
        }))
    : [];

  const latestConstructorStandings = latestRound
    ? constructorStandings
        .filter((s) => s.race.round === latestRound.round)
        .map((s) => ({
          position: s.position,
          constructorId: s.constructorId,
          name: s.constructor.name,
          points: s.points,
          wins: s.wins,
          podiums: constructorPodiums[s.constructorId] || 0,
          color: s.constructor.colorPrimary ?? null,
        }))
    : [];

  // ── Build progression data (points by round) for charts ──
  const rounds = racesWithStandings.map((r) => ({
    round: r.round,
    raceName: r.raceName,
  }));

  // Driver progression: { driverId -> { round -> points } }
  const driverProgressionMap: Record<
    string,
    { name: string; color: string; data: Record<number, number> }
  > = {};

  for (const s of driverStandings) {
    if (!driverProgressionMap[s.driverId]) {
      driverProgressionMap[s.driverId] = {
        name: `${s.driver.firstName[0]}. ${s.driver.lastName}`,
        color:
          s.driver.results[0]?.constructor?.colorPrimary ?? "#3D3D3D",
        data: {},
      };
    }
    driverProgressionMap[s.driverId].data[s.race.round] = s.points;
  }

  // Only include top 10 drivers (by latest standings position)
  const top10DriverIds = latestDriverStandings
    .slice(0, 10)
    .map((d) => d.driverId);

  const driverProgression = top10DriverIds
    .filter((id) => driverProgressionMap[id])
    .map((id) => ({
      id,
      name: driverProgressionMap[id].name,
      color: driverProgressionMap[id].color,
      data: rounds.map((r) => ({
        round: r.round,
        raceName: r.raceName,
        points: driverProgressionMap[id].data[r.round] ?? 0,
      })),
    }));

  // Constructor progression
  const constructorProgressionMap: Record<
    string,
    { name: string; color: string; data: Record<number, number> }
  > = {};

  for (const s of constructorStandings) {
    if (!constructorProgressionMap[s.constructorId]) {
      constructorProgressionMap[s.constructorId] = {
        name: s.constructor.name,
        color: s.constructor.colorPrimary ?? "#3D3D3D",
        data: {},
      };
    }
    constructorProgressionMap[s.constructorId].data[s.race.round] =
      s.points;
  }

  const top10ConstructorIds = latestConstructorStandings
    .slice(0, 10)
    .map((c) => c.constructorId);

  const constructorProgression = top10ConstructorIds
    .filter((id) => constructorProgressionMap[id])
    .map((id) => ({
      id,
      name: constructorProgressionMap[id].name,
      color: constructorProgressionMap[id].color,
      data: rounds.map((r) => ({
        round: r.round,
        raceName: r.raceName,
        points: constructorProgressionMap[id].data[r.round] ?? 0,
      })),
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white">
          {currentYear} Championship Standings
        </h1>
      </div>

      {latestDriverStandings.length === 0 &&
      latestConstructorStandings.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <p className="text-f1-white/40 text-lg mb-2">
            No standings data yet
          </p>
          <p className="text-f1-white/25 text-sm">
            Standings will appear here once race results have been synced.
          </p>
        </div>
      ) : (
        <StandingsClient
          driverStandings={latestDriverStandings}
          constructorStandings={latestConstructorStandings}
          driverProgression={driverProgression}
          constructorProgression={constructorProgression}
          rounds={rounds}
        />
      )}
    </div>
  );
}
