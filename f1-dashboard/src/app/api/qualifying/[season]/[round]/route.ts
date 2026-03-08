import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ season: string; round: string }> }
) {
  try {
    const { season, round } = await params;
    const seasonNum = parseInt(season, 10);
    const roundNum = parseInt(round, 10);

    if (isNaN(seasonNum) || isNaN(roundNum)) {
      return NextResponse.json(
        { error: "Invalid season or round" },
        { status: 400 }
      );
    }

    const race = await prisma.race.findUnique({
      where: { season_round: { season: seasonNum, round: roundNum } },
      select: { id: true },
    });

    if (!race) {
      return NextResponse.json({ error: "Race not found" }, { status: 404 });
    }

    const qualifyingResults = await prisma.qualifyingResult.findMany({
      where: { raceId: race.id },
      include: {
        driver: true,
        constructor: true,
      },
      orderBy: [
        { position: { sort: "asc", nulls: "last" } },
      ],
    });

    return NextResponse.json(qualifyingResults);
  } catch (error) {
    console.error("Failed to fetch qualifying results:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
