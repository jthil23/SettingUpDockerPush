import { prisma } from "@/lib/prisma";
import { getTeamColors } from "@/lib/team-colors";
import {
  getSeasonRaces,
  getRaceResults,
  getQualifyingResults,
  getDriverStandings,
  getConstructorStandings,
  getAllDrivers,
  getAllConstructors,
} from "@/lib/api/jolpica";

async function logSync(
  entity: string,
  recordsUpdated: number,
  status: string = "success"
) {
  await prisma.syncLog.create({
    data: {
      entity,
      status,
      recordsUpdated,
    },
  });
}

export async function syncSeason(year: number): Promise<void> {
  console.log(`[Sync] Syncing season ${year}...`);

  try {
    const races = await getSeasonRaces(year);

    // Upsert season
    await prisma.season.upsert({
      where: { year },
      update: { wikipediaUrl: `https://en.wikipedia.org/wiki/${year}_Formula_One_World_Championship` },
      create: {
        year,
        wikipediaUrl: `https://en.wikipedia.org/wiki/${year}_Formula_One_World_Championship`,
      },
    });

    // Upsert circuits and races
    let recordCount = 0;
    for (const race of races) {
      const circuit = race.Circuit;

      await prisma.circuit.upsert({
        where: { circuitId: circuit.circuitId },
        update: {
          name: circuit.circuitName,
          location: circuit.Location.locality,
          country: circuit.Location.country,
          lat: parseFloat(circuit.Location.lat),
          lng: parseFloat(circuit.Location.long),
        },
        create: {
          circuitId: circuit.circuitId,
          name: circuit.circuitName,
          location: circuit.Location.locality,
          country: circuit.Location.country,
          lat: parseFloat(circuit.Location.lat),
          lng: parseFloat(circuit.Location.long),
        },
      });

      await prisma.race.upsert({
        where: {
          season_round: { season: year, round: parseInt(race.round) },
        },
        update: {
          circuitId: circuit.circuitId,
          raceName: race.raceName,
          date: new Date(race.date),
          time: race.time ?? null,
          fp1Date: race.FirstPractice ? new Date(race.FirstPractice.date) : null,
          fp1Time: race.FirstPractice?.time ?? null,
          fp2Date: race.SecondPractice ? new Date(race.SecondPractice.date) : null,
          fp2Time: race.SecondPractice?.time ?? null,
          fp3Date: race.ThirdPractice ? new Date(race.ThirdPractice.date) : null,
          fp3Time: race.ThirdPractice?.time ?? null,
          qualiDate: race.Qualifying ? new Date(race.Qualifying.date) : null,
          qualiTime: race.Qualifying?.time ?? null,
          sprintDate: race.Sprint ? new Date(race.Sprint.date) : null,
          sprintTime: race.Sprint?.time ?? null,
        },
        create: {
          season: year,
          round: parseInt(race.round),
          circuitId: circuit.circuitId,
          raceName: race.raceName,
          date: new Date(race.date),
          time: race.time ?? null,
          fp1Date: race.FirstPractice ? new Date(race.FirstPractice.date) : null,
          fp1Time: race.FirstPractice?.time ?? null,
          fp2Date: race.SecondPractice ? new Date(race.SecondPractice.date) : null,
          fp2Time: race.SecondPractice?.time ?? null,
          fp3Date: race.ThirdPractice ? new Date(race.ThirdPractice.date) : null,
          fp3Time: race.ThirdPractice?.time ?? null,
          qualiDate: race.Qualifying ? new Date(race.Qualifying.date) : null,
          qualiTime: race.Qualifying?.time ?? null,
          sprintDate: race.Sprint ? new Date(race.Sprint.date) : null,
          sprintTime: race.Sprint?.time ?? null,
        },
      });

      recordCount++;
    }

    await logSync("season", recordCount);
    console.log(`[Sync] Season ${year}: synced ${recordCount} races`);
  } catch (error) {
    console.error(`[Sync] Error syncing season ${year}:`, error);
    await logSync("season", 0, "error");
    throw error;
  }
}

export async function syncDriversAndConstructors(year: number): Promise<void> {
  console.log(`[Sync] Syncing drivers and constructors for ${year}...`);

  try {
    const [drivers, constructors] = await Promise.all([
      getAllDrivers(year),
      getAllConstructors(year),
    ]);

    for (const driver of drivers) {
      await prisma.driver.upsert({
        where: { driverId: driver.driverId },
        update: {
          code: driver.code ?? null,
          number: driver.permanentNumber
            ? parseInt(driver.permanentNumber)
            : null,
          firstName: driver.givenName,
          lastName: driver.familyName,
          dob: driver.dateOfBirth ? new Date(driver.dateOfBirth) : null,
          nationality: driver.nationality,
        },
        create: {
          driverId: driver.driverId,
          code: driver.code ?? null,
          number: driver.permanentNumber
            ? parseInt(driver.permanentNumber)
            : null,
          firstName: driver.givenName,
          lastName: driver.familyName,
          dob: driver.dateOfBirth ? new Date(driver.dateOfBirth) : null,
          nationality: driver.nationality,
        },
      });
    }

    for (const constructor of constructors) {
      const colors = getTeamColors(constructor.constructorId);
      await prisma.constructor.upsert({
        where: { constructorId: constructor.constructorId },
        update: {
          name: constructor.name,
          nationality: constructor.nationality,
          colorPrimary: colors.primary,
          colorSecondary: colors.secondary,
        },
        create: {
          constructorId: constructor.constructorId,
          name: constructor.name,
          nationality: constructor.nationality,
          colorPrimary: colors.primary,
          colorSecondary: colors.secondary,
        },
      });
    }

    await logSync("drivers", drivers.length);
    await logSync("constructors", constructors.length);
    console.log(
      `[Sync] Synced ${drivers.length} drivers, ${constructors.length} constructors`
    );
  } catch (error) {
    console.error(`[Sync] Error syncing drivers/constructors:`, error);
    await logSync("drivers_constructors", 0, "error");
    throw error;
  }
}

export async function syncRaceResults(
  year: number,
  round: number
): Promise<void> {
  console.log(`[Sync] Syncing race results for ${year} round ${round}...`);

  try {
    const raceData = await getRaceResults(year, round);
    if (!raceData || !raceData.Results || raceData.Results.length === 0) {
      console.log(`[Sync] No results available for ${year} round ${round}`);
      return;
    }

    // Find the race record
    const race = await prisma.race.findUnique({
      where: { season_round: { season: year, round } },
    });

    if (!race) {
      console.log(`[Sync] Race record not found for ${year} round ${round}`);
      return;
    }

    let recordCount = 0;
    for (const result of raceData.Results) {
      await prisma.result.upsert({
        where: {
          raceId_driverId: {
            raceId: race.id,
            driverId: result.Driver.driverId,
          },
        },
        update: {
          constructorId: result.Constructor.constructorId,
          grid: parseInt(result.grid),
          position: result.position ? parseInt(result.position) : null,
          positionText: result.positionText,
          points: parseFloat(result.points),
          laps: parseInt(result.laps),
          status: result.status,
          fastestLapTime: result.FastestLap?.Time?.time ?? null,
          fastestLapRank: result.FastestLap
            ? parseInt(result.FastestLap.rank)
            : null,
        },
        create: {
          raceId: race.id,
          driverId: result.Driver.driverId,
          constructorId: result.Constructor.constructorId,
          grid: parseInt(result.grid),
          position: result.position ? parseInt(result.position) : null,
          positionText: result.positionText,
          points: parseFloat(result.points),
          laps: parseInt(result.laps),
          status: result.status,
          fastestLapTime: result.FastestLap?.Time?.time ?? null,
          fastestLapRank: result.FastestLap
            ? parseInt(result.FastestLap.rank)
            : null,
        },
      });
      recordCount++;
    }

    await logSync(`race_results_r${round}`, recordCount);
    console.log(
      `[Sync] Race results for ${year} R${round}: synced ${recordCount} results`
    );
  } catch (error) {
    console.error(
      `[Sync] Error syncing race results for ${year} R${round}:`,
      error
    );
    await logSync(`race_results_r${round}`, 0, "error");
    throw error;
  }
}

export async function syncQualifyingResults(
  year: number,
  round: number
): Promise<void> {
  console.log(
    `[Sync] Syncing qualifying results for ${year} round ${round}...`
  );

  try {
    const raceData = await getQualifyingResults(year, round);
    if (
      !raceData ||
      !raceData.QualifyingResults ||
      raceData.QualifyingResults.length === 0
    ) {
      console.log(
        `[Sync] No qualifying results available for ${year} round ${round}`
      );
      return;
    }

    const race = await prisma.race.findUnique({
      where: { season_round: { season: year, round } },
    });

    if (!race) {
      console.log(`[Sync] Race record not found for ${year} round ${round}`);
      return;
    }

    let recordCount = 0;
    for (const result of raceData.QualifyingResults) {
      await prisma.qualifyingResult.upsert({
        where: {
          raceId_driverId: {
            raceId: race.id,
            driverId: result.Driver.driverId,
          },
        },
        update: {
          constructorId: result.Constructor.constructorId,
          position: parseInt(result.position),
          q1: result.Q1 ?? null,
          q2: result.Q2 ?? null,
          q3: result.Q3 ?? null,
        },
        create: {
          raceId: race.id,
          driverId: result.Driver.driverId,
          constructorId: result.Constructor.constructorId,
          position: parseInt(result.position),
          q1: result.Q1 ?? null,
          q2: result.Q2 ?? null,
          q3: result.Q3 ?? null,
        },
      });
      recordCount++;
    }

    await logSync(`qualifying_results_r${round}`, recordCount);
    console.log(
      `[Sync] Qualifying results for ${year} R${round}: synced ${recordCount} results`
    );
  } catch (error) {
    console.error(
      `[Sync] Error syncing qualifying results for ${year} R${round}:`,
      error
    );
    await logSync(`qualifying_results_r${round}`, 0, "error");
    throw error;
  }
}

export async function syncStandings(year: number): Promise<void> {
  console.log(`[Sync] Syncing standings for ${year}...`);

  try {
    const [driverStandings, constructorStandings] = await Promise.all([
      getDriverStandings(year),
      getConstructorStandings(year),
    ]);

    // Find the latest race that has results to link standings to
    const latestRaceWithResults = await prisma.race.findFirst({
      where: {
        season: year,
        results: { some: {} },
      },
      orderBy: { round: "desc" },
    });

    if (!latestRaceWithResults) {
      console.log(`[Sync] No completed races found for ${year}, skipping standings`);
      return;
    }

    const raceId = latestRaceWithResults.id;

    let driverCount = 0;
    for (const standing of driverStandings) {
      await prisma.driverStanding.upsert({
        where: {
          raceId_driverId: {
            raceId,
            driverId: standing.Driver.driverId,
          },
        },
        update: {
          points: parseFloat(standing.points),
          position: parseInt(standing.position),
          wins: parseInt(standing.wins),
        },
        create: {
          raceId,
          driverId: standing.Driver.driverId,
          points: parseFloat(standing.points),
          position: parseInt(standing.position),
          wins: parseInt(standing.wins),
        },
      });
      driverCount++;
    }

    let constructorCount = 0;
    for (const standing of constructorStandings) {
      await prisma.constructorStanding.upsert({
        where: {
          raceId_constructorId: {
            raceId,
            constructorId: standing.Constructor.constructorId,
          },
        },
        update: {
          points: parseFloat(standing.points),
          position: parseInt(standing.position),
          wins: parseInt(standing.wins),
        },
        create: {
          raceId,
          constructorId: standing.Constructor.constructorId,
          points: parseFloat(standing.points),
          position: parseInt(standing.position),
          wins: parseInt(standing.wins),
        },
      });
      constructorCount++;
    }

    await logSync("driver_standings", driverCount);
    await logSync("constructor_standings", constructorCount);
    console.log(
      `[Sync] Standings for ${year}: ${driverCount} driver, ${constructorCount} constructor`
    );
  } catch (error) {
    console.error(`[Sync] Error syncing standings for ${year}:`, error);
    await logSync("standings", 0, "error");
    throw error;
  }
}

export async function syncAll(year: number): Promise<void> {
  console.log(`[Sync] Starting full sync for ${year}...`);

  try {
    // 1. Sync season schedule (races + circuits)
    await syncSeason(year);

    // 2. Sync drivers and constructors
    await syncDriversAndConstructors(year);

    // 3. Sync results for past races
    const races = await prisma.race.findMany({
      where: {
        season: year,
        date: { lte: new Date() },
      },
      orderBy: { round: "asc" },
    });

    for (const race of races) {
      // Check if results already exist
      const existingResults = await prisma.result.count({
        where: { raceId: race.id },
      });

      if (existingResults === 0) {
        await syncRaceResults(year, race.round);
        await syncQualifyingResults(year, race.round);
      }
    }

    // 4. Sync standings
    await syncStandings(year);

    await logSync("full_sync", 1);
    console.log(`[Sync] Full sync for ${year} completed`);
  } catch (error) {
    console.error(`[Sync] Full sync failed for ${year}:`, error);
    await logSync("full_sync", 0, "error");
  }
}
