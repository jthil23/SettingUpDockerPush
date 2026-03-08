import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const race = await prisma.race.findFirst({
      where: {
        date: { gte: today },
      },
      orderBy: { date: "asc" },
      include: {
        circuit: true,
      },
    });

    if (!race) {
      return NextResponse.json(
        { error: "No upcoming races found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      raceName: race.raceName,
      circuitName: race.circuit.name,
      country: race.circuit.country,
      date: race.date.toISOString().split("T")[0],
      time: race.time ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch next race:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
