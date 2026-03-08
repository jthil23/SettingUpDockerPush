import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const currentYear = new Date().getFullYear();

  const predictions = await prisma.prediction.findMany({
    where: {
      race: { season: currentYear },
    },
    include: {
      race: {
        select: {
          id: true,
          round: true,
          raceName: true,
          date: true,
          season: true,
        },
      },
      winner: {
        select: {
          driverId: true,
          firstName: true,
          lastName: true,
          code: true,
        },
      },
    },
    orderBy: { race: { round: "asc" } },
  });

  // Auto-score predictions that have results but no score yet
  for (const prediction of predictions) {
    if (prediction.score !== null) continue;

    const results = await prisma.result.findMany({
      where: { raceId: prediction.raceId },
      orderBy: { position: "asc" },
    });

    if (results.length === 0) continue;

    const p1 = results.find((r) => r.position === 1);
    const p2 = results.find((r) => r.position === 2);
    const p3 = results.find((r) => r.position === 3);
    const fastestLap = results.find((r) => r.fastestLapRank === 1);

    if (!p1) continue;

    let score = 0;
    const predictedPodium = prediction.predictedPodium as string[];

    if (prediction.predictedWinner === p1.driverId) score += 25;
    if (p2 && predictedPodium.includes(p2.driverId)) score += 10;
    if (p3 && predictedPodium.includes(p3.driverId)) score += 10;
    if (
      prediction.predictedFastestLap &&
      fastestLap &&
      prediction.predictedFastestLap === fastestLap.driverId
    )
      score += 5;

    await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        score,
        actualWinner: p1.driverId,
        actualPodium: [p1.driverId, p2?.driverId, p3?.driverId].filter(
          (id): id is string => Boolean(id)
        ) as string[],
      },
    });

    prediction.score = score;
    prediction.actualWinner = p1.driverId;
    prediction.actualPodium = [p1.driverId, p2?.driverId, p3?.driverId].filter(
      (id): id is string => Boolean(id)
    );
  }

  return NextResponse.json(predictions);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { raceId, predictedWinner, predictedPodium, predictedFastestLap } =
      body;

    if (!raceId || !predictedWinner || !predictedPodium) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate race exists and hasn't happened yet
    const race = await prisma.race.findUnique({
      where: { id: raceId },
    });

    if (!race) {
      return NextResponse.json({ error: "Race not found" }, { status: 404 });
    }

    if (new Date(race.date) < new Date()) {
      return NextResponse.json(
        { error: "Cannot predict a race that has already happened" },
        { status: 400 }
      );
    }

    // Check no existing prediction for this race
    const existing = await prisma.prediction.findUnique({
      where: { raceId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Prediction already exists for this race" },
        { status: 409 }
      );
    }

    const prediction = await prisma.prediction.create({
      data: {
        raceId,
        predictedWinner,
        predictedPodium,
        predictedFastestLap: predictedFastestLap || null,
      },
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
    });

    return NextResponse.json(prediction, { status: 201 });
  } catch (error) {
    console.error("Failed to create prediction:", error);
    return NextResponse.json(
      { error: "Failed to create prediction" },
      { status: 500 }
    );
  }
}
