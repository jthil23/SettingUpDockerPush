import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import {
  syncAll,
  syncRaceResults,
  syncQualifyingResults,
  syncStandings,
} from "@/lib/sync/sync-service";

let isInitialized = false;

export function startSyncScheduler(): void {
  if (isInitialized) {
    console.log("[Scheduler] Already initialized, skipping");
    return;
  }

  isInitialized = true;
  const currentYear = new Date().getFullYear();

  console.log(`[Scheduler] Starting sync scheduler for ${currentYear} season`);

  // Run initial full sync on startup
  syncAll(currentYear).catch((error) => {
    console.error("[Scheduler] Initial sync failed:", error);
  });

  // Hourly cron: sync standings + check for unscored races
  cron.schedule("0 * * * *", async () => {
    console.log("[Scheduler] Running hourly sync...");
    try {
      await syncStandings(currentYear);

      // Check for past races without results
      const unscoredRaces = await prisma.race.findMany({
        where: {
          season: currentYear,
          date: { lte: new Date() },
          results: { none: {} },
        },
        orderBy: { round: "asc" },
      });

      for (const race of unscoredRaces) {
        console.log(
          `[Scheduler] Found unscored race: R${race.round} ${race.raceName}`
        );
        await syncRaceResults(currentYear, race.round);
        await syncQualifyingResults(currentYear, race.round);
      }
    } catch (error) {
      console.error("[Scheduler] Hourly sync error:", error);
    }
  });

  // Race weekend cron: every 15 min on Fri(5), Sat(6), Sun(0)
  cron.schedule("*/15 * * * 5,6,0", async () => {
    console.log("[Scheduler] Running race weekend sync...");
    try {
      // Find races happening this weekend (within 3 days)
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const oneDayAhead = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      const weekendRaces = await prisma.race.findMany({
        where: {
          season: currentYear,
          date: {
            gte: threeDaysAgo,
            lte: oneDayAhead,
          },
        },
      });

      for (const race of weekendRaces) {
        console.log(
          `[Scheduler] Weekend sync for R${race.round} ${race.raceName}`
        );
        await syncRaceResults(currentYear, race.round);
        await syncQualifyingResults(currentYear, race.round);
      }

      await syncStandings(currentYear);
    } catch (error) {
      console.error("[Scheduler] Race weekend sync error:", error);
    }
  });

  console.log("[Scheduler] Cron jobs registered");
}
