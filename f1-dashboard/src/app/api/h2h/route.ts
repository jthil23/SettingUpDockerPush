import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const driver1Id = searchParams.get("driver1");
  const driver2Id = searchParams.get("driver2");
  const season = parseInt(
    searchParams.get("season") ?? String(new Date().getFullYear()),
    10
  );

  if (!driver1Id || !driver2Id) {
    return NextResponse.json(
      { error: "driver1 and driver2 query params are required" },
      { status: 400 }
    );
  }

  if (isNaN(season)) {
    return NextResponse.json(
      { error: "season must be a valid year" },
      { status: 400 }
    );
  }

  // Get race IDs for this season
  const races = await prisma.race.findMany({
    where: { season },
    select: { id: true },
  });
  const raceIds = races.map((r) => r.id);

  if (raceIds.length === 0) {
    return NextResponse.json(
      { error: "No races found for this season" },
      { status: 404 }
    );
  }

  async function getDriverStats(driverId: string) {
    const driver = await prisma.driver.findUnique({
      where: { driverId },
      select: { driverId: true, firstName: true, lastName: true, code: true },
    });

    if (!driver) return null;

    // Get all results for this driver in this season
    const results = await prisma.result.findMany({
      where: {
        driverId,
        raceId: { in: raceIds },
      },
      include: {
        constructor: true,
      },
    });

    // Get all qualifying results for this driver in this season
    const qualifyingResults = await prisma.qualifyingResult.findMany({
      where: {
        driverId,
        raceId: { in: raceIds },
      },
    });

    const raceCount = results.length;
    const wins = results.filter((r) => r.position === 1).length;
    const podiums = results.filter(
      (r) => r.position !== null && r.position <= 3
    ).length;
    const points = results.reduce((sum, r) => sum + r.points, 0);
    const dnfs = results.filter(
      (r) => r.position === null || r.positionText === "R"
    ).length;

    const finishedResults = results.filter((r) => r.position !== null);
    const bestFinish =
      finishedResults.length > 0
        ? Math.min(...finishedResults.map((r) => r.position!))
        : null;
    const avgFinishPos =
      finishedResults.length > 0
        ? finishedResults.reduce((sum, r) => sum + r.position!, 0) /
          finishedResults.length
        : null;

    const qualWithPos = qualifyingResults.filter((q) => q.position !== null);
    const poles = qualWithPos.filter((q) => q.position === 1).length;
    const avgQualPos =
      qualWithPos.length > 0
        ? qualWithPos.reduce((sum, q) => sum + q.position!, 0) /
          qualWithPos.length
        : null;

    // Get team color from most recent result
    const teamColor = results[results.length - 1]?.constructor?.colorPrimary ?? null;
    const teamName = results[results.length - 1]?.constructor?.name ?? null;

    return {
      driverId: driver.driverId,
      name: `${driver.firstName} ${driver.lastName}`,
      code: driver.code,
      teamColor,
      teamName,
      wins,
      podiums,
      poles,
      points,
      dnfs,
      races: raceCount,
      bestFinish,
      avgQualPos: avgQualPos !== null ? Math.round(avgQualPos * 10) / 10 : null,
      avgFinishPos:
        avgFinishPos !== null ? Math.round(avgFinishPos * 10) / 10 : null,
    };
  }

  const [d1Stats, d2Stats] = await Promise.all([
    getDriverStats(driver1Id),
    getDriverStats(driver2Id),
  ]);

  if (!d1Stats || !d2Stats) {
    return NextResponse.json(
      { error: "One or both drivers not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    driver1: d1Stats,
    driver2: d2Stats,
  });
}
