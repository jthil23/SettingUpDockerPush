import type {
  JolpicaResponse,
  RaceTableData,
  DriverTableData,
  ConstructorTableData,
  DriverStandingsData,
  ConstructorStandingsData,
  JolpicaRace,
  JolpicaDriver,
  JolpicaConstructor,
  JolpicaDriverStanding,
  JolpicaConstructorStanding,
  JolpicaPitStop,
  JolpicaLapTiming,
  PitStopTableData,
  LapTableData,
} from "@/lib/api/types";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

async function fetchJolpica<T>(path: string): Promise<JolpicaResponse<T>> {
  const hasLimit = path.includes("limit=");
  const urlSuffix = hasLimit ? "" : `${path.includes("?") ? "&" : "?"}limit=100`;
  const url = `${BASE_URL}${path}${urlSuffix}`;

  const response = await fetch(url, { next: { revalidate: 300 } });

  if (!response.ok) {
    throw new Error(
      `Jolpica API error: ${response.status} ${response.statusText} for ${url}`
    );
  }

  return response.json() as Promise<JolpicaResponse<T>>;
}

export async function getSeasonRaces(year: number): Promise<JolpicaRace[]> {
  const data = await fetchJolpica<RaceTableData>(`/${year}.json`);
  return data.MRData.RaceTable.Races;
}

export async function getRaceResults(
  year: number,
  round: number
): Promise<JolpicaRace | null> {
  const data = await fetchJolpica<RaceTableData>(
    `/${year}/${round}/results.json`
  );
  return data.MRData.RaceTable.Races[0] ?? null;
}

export async function getQualifyingResults(
  year: number,
  round: number
): Promise<JolpicaRace | null> {
  const data = await fetchJolpica<RaceTableData>(
    `/${year}/${round}/qualifying.json`
  );
  return data.MRData.RaceTable.Races[0] ?? null;
}

export async function getDriverStandings(
  year: number,
  round?: number
): Promise<JolpicaDriverStanding[]> {
  const path = round
    ? `/${year}/${round}/driverStandings.json`
    : `/${year}/driverStandings.json`;
  const data = await fetchJolpica<DriverStandingsData>(path);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

export async function getConstructorStandings(
  year: number,
  round?: number
): Promise<JolpicaConstructorStanding[]> {
  const path = round
    ? `/${year}/${round}/constructorStandings.json`
    : `/${year}/constructorStandings.json`;
  const data = await fetchJolpica<ConstructorStandingsData>(path);
  return (
    data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? []
  );
}

export async function getAllDrivers(year: number): Promise<JolpicaDriver[]> {
  const data = await fetchJolpica<DriverTableData>(`/${year}/drivers.json`);
  return data.MRData.DriverTable.Drivers;
}

export async function getAllConstructors(
  year: number
): Promise<JolpicaConstructor[]> {
  const data = await fetchJolpica<ConstructorTableData>(
    `/${year}/constructors.json`
  );
  return data.MRData.ConstructorTable.Constructors;
}

export async function getPitStops(year: number, round: number): Promise<JolpicaPitStop[]> {
  const data = await fetchJolpica<PitStopTableData>(`/${year}/${round}/pitstops.json`);
  return data.MRData.RaceTable.Races[0]?.PitStops ?? [];
}

export async function getLapTimings(year: number, round: number): Promise<JolpicaLapTiming[]> {
  const data = await fetchJolpica<LapTableData>(`/${year}/${round}/laps.json?limit=2000`);
  return data.MRData.RaceTable.Races[0]?.Laps ?? [];
}
