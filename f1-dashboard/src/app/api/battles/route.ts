import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const seasonParam = request.nextUrl.searchParams.get("season");
  const currentYear = seasonParam ? parseInt(seasonParam, 10) : new Date().getFullYear();

  const constructors = await prisma.constructor.findMany({
    where: { results: { some: { race: { season: currentYear } } } },
    include: {
      results: {
        where: { race: { season: currentYear } },
        include: { driver: true, race: true, constructor: true },
        orderBy: [{ race: { round: "asc" } }],
      },
      qualifyingResults: {
        where: { race: { season: currentYear } },
        include: { driver: true, race: true, constructor: true },
        orderBy: [{ race: { round: "asc" } }],
      },
    },
  });

  const battles = constructors.map((team) => {
    const driverRaceCounts = new Map<string, number>();
    for (const result of team.results) {
      driverRaceCounts.set(result.driverId, (driverRaceCounts.get(result.driverId) ?? 0) + 1);
    }

    const topDriverIds = Array.from(driverRaceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => id);

    if (topDriverIds.length < 2) return null;

    const [d1Id, d2Id] = topDriverIds;

    const d1Results = team.results.filter((r) => r.driverId === d1Id);
    const d2Results = team.results.filter((r) => r.driverId === d2Id);
    const d1Rounds = new Set(d1Results.map((r) => r.race.round));
    const d2Rounds = new Set(d2Results.map((r) => r.race.round));
    const sharedRounds = new Set([...d1Rounds].filter((r) => d2Rounds.has(r)));

    let d1RaceWins = 0, d2RaceWins = 0, d1Points = 0, d2Points = 0;

    for (const round of sharedRounds) {
      const r1 = d1Results.find((r) => r.race.round === round);
      const r2 = d2Results.find((r) => r.race.round === round);
      if (r1 && r2 && r1.position && r2.position) {
        if (r1.position < r2.position) d1RaceWins++;
        else if (r2.position < r1.position) d2RaceWins++;
      }
      d1Points += r1?.points ?? 0;
      d2Points += r2?.points ?? 0;
    }

    const d1Quali = team.qualifyingResults.filter((q) => q.driverId === d1Id);
    const d2Quali = team.qualifyingResults.filter((q) => q.driverId === d2Id);
    const d1QualiRounds = new Set(d1Quali.map((q) => q.race.round));
    const d2QualiRounds = new Set(d2Quali.map((q) => q.race.round));
    const sharedQualiRounds = new Set([...d1QualiRounds].filter((r) => d2QualiRounds.has(r)));

    let d1QualiWins = 0, d2QualiWins = 0;

    for (const round of sharedQualiRounds) {
      const q1 = d1Quali.find((q) => q.race.round === round);
      const q2 = d2Quali.find((q) => q.race.round === round);
      if (q1?.position && q2?.position) {
        if (q1.position < q2.position) d1QualiWins++;
        else if (q2.position < q1.position) d2QualiWins++;
      }
    }

    const d1Info = d1Results[0]?.driver;
    const d2Info = d2Results[0]?.driver;

    return {
      constructorId: team.constructorId,
      constructorName: team.name,
      colorPrimary: team.colorPrimary,
      colorSecondary: team.colorSecondary,
      driver1: {
        driverId: d1Id,
        code: d1Info?.code ?? d1Id.substring(0, 3).toUpperCase(),
        name: d1Info ? `${d1Info.firstName} ${d1Info.lastName}` : d1Id,
        raceWins: d1RaceWins, qualiWins: d1QualiWins, points: d1Points,
      },
      driver2: {
        driverId: d2Id,
        code: d2Info?.code ?? d2Id.substring(0, 3).toUpperCase(),
        name: d2Info ? `${d2Info.firstName} ${d2Info.lastName}` : d2Id,
        raceWins: d2RaceWins, qualiWins: d2QualiWins, points: d2Points,
      },
      totalRaces: sharedRounds.size,
    };
  }).filter(Boolean);

  return Response.json(battles);
}
