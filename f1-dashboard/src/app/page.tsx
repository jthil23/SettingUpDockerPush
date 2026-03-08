import { prisma } from "@/lib/prisma";
import HeroCountdown from "@/components/dashboard/HeroCountdown";
import { getTeamColor } from "@/lib/team-colors";

export const dynamic = "force-dynamic";
import MiniStandings from "@/components/dashboard/MiniStandings";
import RecentResult from "@/components/dashboard/RecentResult";
import LiveTimingWrapper from "@/components/live/LiveTimingWrapper";
import SeasonTimeline from "@/components/dashboard/SeasonTimeline";

export default async function Home() {
  const now = new Date();
  const currentYear = now.getFullYear();

  // ── Next upcoming race ──
  const nextRace = await prisma.race.findFirst({
    where: { date: { gte: now } },
    include: { circuit: true },
    orderBy: { date: "asc" },
  });

  // ── Latest race that has driver standings (to get most recent standings snapshot) ──
  const latestStandingsRace = await prisma.race.findFirst({
    where: {
      season: currentYear,
      driverStandings: { some: {} },
    },
    orderBy: { round: "desc" },
    select: { id: true },
  });

  // ── Driver standings (top 10 from latest race with standings) ──
  let driverStandingsData: {
    position: number;
    name: string;
    points: number;
    color: string | null;
  }[] = [];

  if (latestStandingsRace) {
    const driverStandings = await prisma.driverStanding.findMany({
      where: { raceId: latestStandingsRace.id },
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
      },
      orderBy: { position: "asc" },
      take: 10,
    });

    driverStandingsData = driverStandings.map((s) => ({
      position: s.position,
      name: s.driver.lastName,
      points: s.points,
      color: s.driver.results[0]?.constructor?.colorPrimary ?? null,
    }));
  } else {
    // No standings yet - show qualifying grid as preview
    const latestQualiRace = await prisma.race.findFirst({
      where: {
        season: currentYear,
        qualifyingResults: { some: {} },
      },
      orderBy: { round: "desc" },
      select: { id: true },
    });

    if (latestQualiRace) {
      const qualiResults = await prisma.qualifyingResult.findMany({
        where: { raceId: latestQualiRace.id },
        include: {
          driver: true,
          constructor: true,
        },
        orderBy: { position: "asc" },
        take: 10,
      });

      driverStandingsData = qualiResults.map((q) => ({
        position: q.position ?? 0,
        name: q.driver.lastName,
        points: 0,
        color: q.constructor.colorPrimary ?? getTeamColor(q.constructorId),
      }));
    }
  }

  // ── Constructor standings (top 10) ──
  let constructorStandingsData: {
    position: number;
    name: string;
    points: number;
    color: string | null;
  }[] = [];

  const latestConstructorStandingsRace = await prisma.race.findFirst({
    where: {
      season: currentYear,
      constructorStandings: { some: {} },
    },
    orderBy: { round: "desc" },
    select: { id: true },
  });

  if (latestConstructorStandingsRace) {
    const constructorStandings =
      await prisma.constructorStanding.findMany({
        where: { raceId: latestConstructorStandingsRace.id },
        include: { constructor: true },
        orderBy: { position: "asc" },
        take: 10,
      });

    constructorStandingsData = constructorStandings.map((s) => ({
      position: s.position,
      name: s.constructor.name,
      points: s.points,
      color: s.constructor.colorPrimary ?? null,
    }));
  } else {
    // No constructor standings - show constructors from qualifying
    const constructors = await prisma.constructor.findMany({
      where: {
        qualifyingResults: { some: { race: { season: currentYear } } },
      },
      orderBy: { name: "asc" },
    });

    constructorStandingsData = constructors.map((c, i) => ({
      position: i + 1,
      name: c.name,
      points: 0,
      color: c.colorPrimary ?? getTeamColor(c.constructorId),
    }));
  }

  // ── Most recent race with results ──
  const recentRace = await prisma.race.findFirst({
    where: { results: { some: {} } },
    include: {
      results: {
        include: { driver: true, constructor: true },
        orderBy: { position: "asc" },
      },
      circuit: true,
    },
    orderBy: { date: "desc" },
  });

  // ── Season timeline ──
  const allRaces = await prisma.race.findMany({
    where: { season: currentYear },
    include: {
      results: {
        where: { position: 1 },
        include: { driver: true, constructor: true },
        take: 1,
      },
    },
    orderBy: { round: "asc" },
  });

  const timelineData = allRaces.map((race) => {
    const winner = race.results[0];
    return {
      round: race.round,
      raceName: race.raceName,
      date: race.date.toISOString().split("T")[0],
      isPast: race.date < now,
      isNext: nextRace?.id === race.id,
      winnerColor: winner?.constructor?.colorPrimary ?? null,
      winnerCode: winner?.driver?.code ?? null,
    };
  });

  // Build podium data
  const podium =
    recentRace?.results
      .filter((r) => r.position !== null && r.position <= 3)
      .map((r) => ({
        position: r.position!,
        firstName: r.driver.firstName,
        lastName: r.driver.lastName,
        constructorName: r.constructor.name,
        constructorColor: r.constructor.colorPrimary ?? null,
        time: r.position === 1 ? r.fastestLapTime : null,
        gap: r.status ?? null,
      })) ?? [];

  // Fastest lap
  const fastestLapResult = recentRace?.results.find(
    (r) => r.fastestLapRank === 1
  );
  const fastestLap = fastestLapResult
    ? {
        driverName: `${fastestLapResult.driver.firstName} ${fastestLapResult.driver.lastName}`,
        time: fastestLapResult.fastestLapTime ?? "",
      }
    : null;

  const hasStandings = !!latestStandingsRace;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero — full width */}
      <HeroCountdown
        raceName={nextRace?.raceName ?? null}
        circuitName={nextRace?.circuit.name ?? null}
        country={nextRace?.circuit.country ?? null}
        raceDate={nextRace?.date ? nextRace.date.toISOString().split("T")[0] : null}
        raceTime={nextRace?.time ?? null}
      />

      {/* Live Timing (visible only when a session is active) */}
      <LiveTimingWrapper />

      {/* Standings — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MiniStandings
          type="drivers"
          standings={driverStandingsData}
          label={!hasStandings && driverStandingsData.length > 0 ? "Qualifying Grid" : undefined}
        />
        <MiniStandings
          type="constructors"
          standings={constructorStandingsData}
          label={!hasStandings && constructorStandingsData.length > 0 ? "Season Entry" : undefined}
        />
      </div>

      {/* Season Timeline */}
      <SeasonTimeline races={timelineData} season={currentYear} />

      {/* Recent Result */}
      <RecentResult
        raceName={recentRace?.raceName ?? null}
        circuitName={recentRace?.circuit.name ?? null}
        raceId={recentRace?.id ?? null}
        podium={podium}
        fastestLap={fastestLap}
      />
    </div>
  );
}
