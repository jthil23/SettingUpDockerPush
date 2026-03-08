import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") ?? "drivers";
  const season = parseInt(searchParams.get("season") ?? String(new Date().getFullYear()), 10);

  if (type !== "drivers" && type !== "constructors") {
    return NextResponse.json(
      { error: "type must be 'drivers' or 'constructors'" },
      { status: 400 }
    );
  }

  if (isNaN(season)) {
    return NextResponse.json(
      { error: "season must be a valid year" },
      { status: 400 }
    );
  }

  // Find the latest race with standings for this season
  const latestRace = await prisma.race.findFirst({
    where: {
      season,
      ...(type === "drivers"
        ? { driverStandings: { some: {} } }
        : { constructorStandings: { some: {} } }),
    },
    orderBy: { round: "desc" },
    select: { id: true, round: true, raceName: true },
  });

  if (!latestRace) {
    return NextResponse.json({ standings: [], race: null });
  }

  if (type === "drivers") {
    const standings = await prisma.driverStanding.findMany({
      where: { raceId: latestRace.id },
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
    });

    return NextResponse.json({
      race: { round: latestRace.round, name: latestRace.raceName },
      standings: standings.map((s) => ({
        position: s.position,
        driverId: s.driverId,
        firstName: s.driver.firstName,
        lastName: s.driver.lastName,
        points: s.points,
        wins: s.wins,
        color: s.driver.results[0]?.constructor?.colorPrimary ?? null,
        constructorName: s.driver.results[0]?.constructor?.name ?? null,
      })),
    });
  }

  // Constructors
  const standings = await prisma.constructorStanding.findMany({
    where: { raceId: latestRace.id },
    include: { constructor: true },
    orderBy: { position: "asc" },
  });

  return NextResponse.json({
    race: { round: latestRace.round, name: latestRace.raceName },
    standings: standings.map((s) => ({
      position: s.position,
      constructorId: s.constructorId,
      name: s.constructor.name,
      points: s.points,
      wins: s.wins,
      color: s.constructor.colorPrimary ?? null,
    })),
  });
}
