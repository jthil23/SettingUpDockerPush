import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCountryFlag } from "@/lib/country-flags";
import DriverProfile from "@/components/drivers/DriverProfile";
import { User, ArrowLeft, GitCompare, Users } from "lucide-react";

interface DriverPageProps {
  params: Promise<{ driverId: string }>;
}

export async function generateMetadata({ params }: DriverPageProps) {
  const { driverId } = await params;
  const driver = await prisma.driver.findUnique({
    where: { driverId },
    select: { firstName: true, lastName: true },
  });

  if (!driver) {
    return { title: "Driver Not Found | F1 Dashboard" };
  }

  return {
    title: `${driver.firstName} ${driver.lastName} | F1 Dashboard`,
    description: `Profile and stats for ${driver.firstName} ${driver.lastName}`,
  };
}

export default async function DriverPage({ params }: DriverPageProps) {
  const { driverId } = await params;
  const currentYear = new Date().getFullYear();

  const driver = await prisma.driver.findUnique({
    where: { driverId },
  });

  if (!driver) {
    notFound();
  }

  // Get all results for this driver (career)
  const allResults = await prisma.result.findMany({
    where: { driverId },
    include: {
      race: { select: { season: true, round: true, raceName: true, date: true } },
      constructor: true,
    },
    orderBy: [{ race: { season: "desc" } }, { race: { round: "desc" } }],
  });

  // Current season results
  const seasonResults = allResults
    .filter((r) => r.race.season === currentYear)
    .sort((a, b) => a.race.round - b.race.round);

  // Career aggregates
  const totalRaces = allResults.length;
  const totalWins = allResults.filter((r) => r.position === 1).length;
  const totalPodiums = allResults.filter(
    (r) => r.position !== null && r.position <= 3
  ).length;
  const totalPoints = Math.round(
    allResults.reduce((sum, r) => sum + r.points, 0)
  );
  const totalDnfs = allResults.filter(
    (r) => r.status !== null && r.status !== "Finished" && !r.status.startsWith("+")
  ).length;

  // Current standing
  const latestRaceWithStandings = await prisma.race.findFirst({
    where: {
      season: currentYear,
      driverStandings: { some: { driverId } },
    },
    orderBy: { round: "desc" },
    select: { id: true },
  });

  let currentStanding: { position: number; points: number; wins: number } | null =
    null;
  let currentConstructor: {
    constructorId: string;
    name: string;
    colorPrimary: string | null;
  } | null = null;

  if (latestRaceWithStandings) {
    const standing = await prisma.driverStanding.findUnique({
      where: {
        raceId_driverId: {
          raceId: latestRaceWithStandings.id,
          driverId,
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

  // Get the constructor from the latest result
  if (seasonResults.length > 0) {
    const latestResult = seasonResults[seasonResults.length - 1];
    currentConstructor = {
      constructorId: latestResult.constructor.constructorId,
      name: latestResult.constructor.name,
      colorPrimary: latestResult.constructor.colorPrimary,
    };
  }

  const teamColor = currentConstructor?.colorPrimary || "#E10600";
  const flag = getCountryFlag(driver.nationality);

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/drivers"
        className="inline-flex items-center gap-1.5 text-sm text-f1-white/40 hover:text-f1-white transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        All Drivers
      </Link>

      {/* Header */}
      <div className="card p-0 overflow-hidden">
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${teamColor}, ${teamColor}60)`,
          }}
        />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Driver number */}
              <div
                className="font-heading text-5xl font-bold tabular-nums"
                style={{ color: `${teamColor}80` }}
              >
                {driver.number ?? "--"}
              </div>

              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white">
                  {driver.firstName}{" "}
                  <span className="uppercase">{driver.lastName}</span>
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-lg">{flag}</span>
                  <span className="text-sm text-f1-white/50">
                    {driver.nationality}
                  </span>
                  {currentConstructor && (
                    <>
                      <span className="text-f1-white/20">|</span>
                      <Link
                        href={`/teams/${currentConstructor.constructorId}`}
                        className="text-sm hover:underline transition-colors"
                        style={{ color: teamColor }}
                      >
                        {currentConstructor.name}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Championship position */}
            {currentStanding && (
              <div className="flex items-center gap-4 sm:text-right">
                <div>
                  <div className="text-xs text-f1-white/40 uppercase tracking-wider font-heading">
                    Championship
                  </div>
                  <div className="font-mono text-3xl font-bold text-f1-white tabular-nums">
                    P{currentStanding.position}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-f1-white/40 uppercase tracking-wider font-heading">
                    Points
                  </div>
                  <div className="font-mono text-3xl font-bold tabular-nums" style={{ color: teamColor }}>
                    {currentStanding.points}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action links */}
          <div className="flex gap-3 mt-4">
            {currentConstructor && (
              <Link
                href={`/teams/${currentConstructor.constructorId}`}
                className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md border border-f1-carbon hover:border-f1-white/20 text-f1-white/60 hover:text-f1-white transition-colors"
              >
                <Users size={14} />
                Team Profile
              </Link>
            )}
            <Link
              href={`/head-to-head?driver=${driverId}`}
              className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold uppercase tracking-wider px-3 py-1.5 rounded-md border border-f1-carbon hover:border-f1-white/20 text-f1-white/60 hover:text-f1-white transition-colors"
            >
              <GitCompare size={14} />
              Compare
            </Link>
          </div>
        </div>
      </div>

      {/* Career Stats */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-f1-white mb-3">
          Career Statistics
        </h2>
        <DriverProfile
          stats={{
            races: totalRaces,
            wins: totalWins,
            podiums: totalPodiums,
            points: totalPoints,
            dnfs: totalDnfs,
          }}
        />
      </div>

      {/* Current Season Results */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-f1-white mb-3">
          {currentYear} Season Results
        </h2>

        {seasonResults.length === 0 ? (
          <div className="card flex items-center justify-center py-12">
            <p className="text-f1-white/30 text-sm">
              No results for the current season yet.
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_4rem_4rem_5rem_5rem] gap-2 px-4 py-3 border-b border-f1-carbon text-xs font-heading font-semibold text-f1-white/40 uppercase tracking-wider">
              <span>Rnd</span>
              <span>Race</span>
              <span className="text-right">Grid</span>
              <span className="text-right">Pos</span>
              <span className="text-right">Pts</span>
              <span className="text-right">Status</span>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-f1-carbon/50">
              {seasonResults.map((result) => {
                const isFinished =
                  result.status === "Finished" ||
                  (result.status?.startsWith("+") ?? false);
                const isWin = result.position === 1;
                const isPodium =
                  result.position !== null && result.position <= 3;

                return (
                  <div
                    key={result.id}
                    className={`grid grid-cols-[3rem_1fr_4rem_4rem_5rem_5rem] gap-2 px-4 py-3 items-center transition-colors hover:bg-f1-carbon/30 ${
                      isWin
                        ? "border-l-2 border-l-yellow-400/60"
                        : isPodium
                          ? "border-l-2 border-l-amber-600/40"
                          : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <span className="font-mono text-sm text-f1-white/50 tabular-nums">
                      {result.race.round}
                    </span>
                    <span className="text-sm text-f1-white truncate">
                      {result.race.raceName}
                    </span>
                    <span className="font-mono text-sm text-f1-white/60 tabular-nums text-right">
                      {result.grid ?? "--"}
                    </span>
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
                    <span
                      className={`text-xs text-right truncate ${
                        isFinished ? "text-f1-white/30" : "text-red-400/70"
                      }`}
                    >
                      {result.status ?? "--"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
