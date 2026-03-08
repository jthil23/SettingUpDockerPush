import { NextRequest, NextResponse } from "next/server";
import {
  syncAll,
  syncSeason,
  syncDriversAndConstructors,
  syncRaceResults,
  syncQualifyingResults,
  syncStandings,
} from "@/lib/sync/sync-service";

export async function POST(request: NextRequest) {
  try {
    const { action, year, round } = await request.json();
    const syncYear = year ?? new Date().getFullYear();

    switch (action) {
      case "full":
        await syncAll(syncYear);
        return NextResponse.json({ message: `Full sync completed for ${syncYear}` });

      case "season":
        await syncSeason(syncYear);
        return NextResponse.json({ message: `Season schedule synced for ${syncYear}` });

      case "drivers":
        await syncDriversAndConstructors(syncYear);
        return NextResponse.json({ message: `Drivers & constructors synced for ${syncYear}` });

      case "results":
        if (!round) {
          return NextResponse.json({ error: "Round number required for results sync" }, { status: 400 });
        }
        await syncRaceResults(syncYear, round);
        await syncQualifyingResults(syncYear, round);
        return NextResponse.json({ message: `Results synced for ${syncYear} R${round}` });

      case "standings":
        await syncStandings(syncYear);
        return NextResponse.json({ message: `Standings synced for ${syncYear}` });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[API] Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
