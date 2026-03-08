import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCountryFlag } from "@/lib/country-flags";
import TeamProfile from "@/components/teams/TeamProfile";
import { ArrowLeft, Users } from "lucide-react";

interface TeamPageProps {
  params: Promise<{ constructorId: string }>;
}

export async function generateMetadata({ params }: TeamPageProps) {
  const { constructorId } = await params;
  const team = await prisma.constructor.findUnique({
    where: { constructorId },
  });

  if (!team) {
    return { title: "Team Not Found | F1 Dashboard" };
  }

  return {
    title: `${team.name} | F1 Dashboard`,
    description: `Team profile and stats for ${team.name}`,
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { constructorId } = await params;
  const currentYear = new Date().getFullYear();

  const constructor = await prisma.constructor.findUnique({
    where: { constructorId },
  });

  if (!constructor) {
    notFound();
  }

  const teamColor = constructor.colorPrimary || "#E10600";
  const flag = getCountryFlag(constructor.nationality);

  // Get current season results for this constructor
  const seasonResults = await prisma.result.findMany({
    where: {
      constructorId,
      race: { season: currentYear },
    },
    include: {
      race: { select: { round: true, raceName: true, date: true } },
      driver: true,
      constructor: true,
    },
    orderBy: [{ race: { round: "asc" } }, { position: { sort: "asc", nulls: "last" } }],
  });

  // Find the current drivers (from latest results)
  const driverMap = new Map<
    string,
    { driverId: string; firstName: string; lastName: string; number: number | null }
  >();
  for (const r of seasonResults) {
    driverMap.set(r.driverId, r.driver);
  }
  const currentDrivers = Array.from(driverMap.values());

  // Aggregate stats
  const totalRaces = new Set(seasonResults.map((r) => r.race.round)).size;
  const totalWins = seasonResults.filter((r) => r.position === 1).length;
  const totalPodiums = seasonResults.filter(
    (r) => r.position !== null && r.position <= 3
  ).length;
  const totalPoints = Math.round(
    seasonResults.reduce((sum, r) => sum + r.points, 0)
  );

  // Current constructor standing
  const latestRaceWithStandings = await prisma.race.findFirst({
    where: {
      season: currentYear,
      constructorStandings: { some: { constructorId } },
    },
    orderBy: { round: "desc" },
    select: { id: true },
  });

  let currentStanding: { position: number; points: number; wins: number } | null = null;

  if (latestRaceWithStandings) {
    const standing = await prisma.constructorStanding.findUnique({
      where: {
        raceId_constructorId: {
          raceId: latestRaceWithStandings.id,
          constructorId,
        },
      },
    });
    if (standing) {
      currentStanding = {
        position: standing.position,
        points: standing.points,
        wins: standing.wins,
      };
    }
  }

  // Group results by round for the results table
  const roundsMap = new Map<
    number,
    {
      round: number;
      raceName: string;
      results: typeof seasonResults;
    }
  >();

  for (const r of seasonResults) {
    if (!roundsMap.has(r.race.round)) {
      roundsMap.set(r.race.round, {
        round: r.race.round,
        raceName: r.race.raceName,
        results: [],
      });
    }
    roundsMap.get(r.race.round)!.results.push(r);
  }

  const rounds = Array.from(roundsMap.values()).sort(
    (a, b) => a.round - b.round
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/standings"
        className="inline-flex items-center gap-1.5 text-sm text-f1-white/40 hover:text-f1-white transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Standings
      </Link>

      {/* Team header with color gradient */}
      <div className="card p-0 overflow-hidden">
        <div
          className="h-2 w-full"
          style={{
            background: `linear-gradient(90deg, ${teamColor}, ${constructor.colorSecondary || teamColor}80)`,
          }}
        />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white">
                {constructor.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-lg">{flag}</span>
                <span className="text-sm text-f1-white/50">
                  {constructor.nationality}
                </span>
                <span className="text-f1-white/20">|</span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: teamColor }}
                  />
                  {constructor.colorSecondary && (
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: constructor.colorSecondary }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Championship position */}
            {currentStanding && (
              <div className="flex items-center gap-4 sm:text-right">
                <div>
                  <div className="text-xs text-f1-white/40 uppercase tracking-wider font-heading">
                    Constructors
                  </div>
                  <div className="font-mono text-3xl font-bold text-f1-white tabular-nums">
                    P{currentStanding.position}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-f1-white/40 uppercase tracking-wider font-heading">
                    Points
                  </div>
                  <div
                    className="font-mono text-3xl font-bold tabular-nums"
                    style={{ color: teamColor }}
                  >
                    {currentStanding.points}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Drivers */}
      {currentDrivers.length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold text-f1-white mb-3 flex items-center gap-2">
            <Users size={18} className="text-f1-red" />
            Drivers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentDrivers.map((d) => (
              <Link
                key={d.driverId}
                href={`/drivers/${d.driverId}`}
                className="card-hover flex items-center gap-4 group"
              >
                <div
                  className="font-heading text-3xl font-bold tabular-nums"
                  style={{ color: `${teamColor}60` }}
                >
                  {d.number ?? "--"}
                </div>
                <div>
                  <span className="text-f1-white/70 text-sm">
                    {d.firstName}
                  </span>{" "}
                  <span className="text-f1-white font-bold uppercase text-sm">
                    {d.lastName}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Season Performance */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-f1-white mb-3">
          {currentYear} Performance
        </h2>
        <TeamProfile
          stats={{
            races: totalRaces,
            wins: totalWins,
            podiums: totalPodiums,
            points: totalPoints,
          }}
          color={teamColor}
        />
      </div>

      {/* Season Results Table */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-f1-white mb-3">
          {currentYear} Results
        </h2>

        {rounds.length === 0 ? (
          <div className="card flex items-center justify-center py-12">
            <p className="text-f1-white/30 text-sm">
              No results for the current season yet.
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_8rem_4rem_5rem] gap-2 px-4 py-3 border-b border-f1-carbon text-xs font-heading font-semibold text-f1-white/40 uppercase tracking-wider">
              <span>Rnd</span>
              <span>Race</span>
              <span>Driver</span>
              <span className="text-right">Pos</span>
              <span className="text-right">Pts</span>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-f1-carbon/50">
              {rounds.map((round) =>
                round.results.map((result, idx) => {
                  const isWin = result.position === 1;
                  const isPodium =
                    result.position !== null && result.position <= 3;

                  return (
                    <div
                      key={result.id}
                      className={`grid grid-cols-[3rem_1fr_8rem_4rem_5rem] gap-2 px-4 py-3 items-center transition-colors hover:bg-f1-carbon/30 ${
                        isWin
                          ? "border-l-2 border-l-yellow-400/60"
                          : isPodium
                            ? "border-l-2 border-l-amber-600/40"
                            : "border-l-2 border-l-transparent"
                      }`}
                    >
                      <span className="font-mono text-sm text-f1-white/50 tabular-nums">
                        {idx === 0 ? round.round : ""}
                      </span>
                      <span className="text-sm text-f1-white truncate">
                        {idx === 0 ? round.raceName : ""}
                      </span>
                      <Link
                        href={`/drivers/${result.driver.driverId}`}
                        className="text-sm text-f1-white/70 hover:text-f1-white truncate transition-colors"
                      >
                        {result.driver.lastName}
                      </Link>
                      <span
                        className={`font-mono text-sm tabular-nums text-right font-bold ${
                          isWin
                            ? "text-yellow-400"
                            : isPodium
                              ? "text-amber-400"
                              : "text-f1-white"
                        }`}
                      >
                        {result.positionText ?? "DNF"}
                      </span>
                      <span className="font-mono text-sm text-f1-white/70 tabular-nums text-right">
                        {result.points}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
