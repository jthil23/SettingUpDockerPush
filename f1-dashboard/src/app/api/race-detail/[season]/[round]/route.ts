import { prisma } from "@/lib/prisma";
import { getPitStops, getLapTimings } from "@/lib/api/jolpica";
import {
  getSessionByMeeting,
  getLapData,
  getStints,
  getRaceControlMessages,
  getWeatherData,
  getTeamRadio,
  getDriverNumbers,
} from "@/lib/api/openf1";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ season: string; round: string }> }
) {
  const { season, round } = await params;
  const seasonNum = parseInt(season);
  const roundNum = parseInt(round);

  if (isNaN(seasonNum) || isNaN(roundNum)) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const race = await prisma.race.findUnique({
    where: { season_round: { season: seasonNum, round: roundNum } },
    include: {
      circuit: true,
      results: {
        include: { driver: true, constructor: true },
        orderBy: { position: "asc" },
      },
      qualifyingResults: {
        include: { driver: true, constructor: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!race) {
    return Response.json({ error: "Race not found" }, { status: 404 });
  }

  const [pitStops, lapTimings] = await Promise.all([
    getPitStops(seasonNum, roundNum).catch(() => []),
    getLapTimings(seasonNum, roundNum).catch(() => []),
  ]);

  const countryName = race.circuit.country;
  const openF1Session = await getSessionByMeeting(seasonNum, countryName, "Race");

  let openF1Data = {
    laps: [] as any[],
    stints: [] as any[],
    raceControl: [] as any[],
    weather: [] as any[],
    teamRadio: [] as any[],
    drivers: [] as any[],
  };

  if (openF1Session) {
    const [laps, stints, raceControl, weather, teamRadio, drivers] =
      await Promise.all([
        getLapData(openF1Session.session_key).catch(() => []),
        getStints(openF1Session.session_key).catch(() => []),
        getRaceControlMessages(openF1Session.session_key).catch(() => []),
        getWeatherData(openF1Session.session_key).catch(() => []),
        getTeamRadio(openF1Session.session_key).catch(() => []),
        getDriverNumbers(openF1Session.session_key).catch(() => []),
      ]);

    openF1Data = { laps, stints, raceControl, weather, teamRadio, drivers };
  }

  return Response.json({
    race: {
      id: race.id,
      season: race.season,
      round: race.round,
      raceName: race.raceName,
      date: race.date,
      time: race.time,
      circuit: race.circuit,
    },
    results: race.results,
    qualifying: race.qualifyingResults,
    pitStops,
    lapTimings,
    openF1: openF1Data,
    hasOpenF1Data: !!openF1Session,
  });
}
