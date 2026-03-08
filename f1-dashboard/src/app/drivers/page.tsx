import { prisma } from "@/lib/prisma";
import DriverCard from "@/components/drivers/DriverCard";
import { Users } from "lucide-react";
import { getTeamColor } from "@/lib/team-colors";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Drivers | F1 Dashboard",
  description: "Current F1 driver profiles, stats, and championship standings",
};

interface DriverWithStanding {
  driverId: string;
  firstName: string;
  lastName: string;
  number: number | null;
  nationality: string;
  position: number;
  points: number;
  constructorName: string;
  constructorColor: string | null;
}

export default async function DriversPage() {
  const currentYear = new Date().getFullYear();

  // Get the latest race with driver standings this season
  const latestRaceWithStandings = await prisma.race.findFirst({
    where: {
      season: currentYear,
      driverStandings: { some: {} },
    },
    orderBy: { round: "desc" },
    select: { id: true },
  });

  let drivers: DriverWithStanding[] = [];

  if (latestRaceWithStandings) {
    // We have standings - use them (original behavior)
    const standings = await prisma.driverStanding.findMany({
      where: { raceId: latestRaceWithStandings.id },
      include: {
        driver: {
          include: {
            results: {
              where: { race: { season: currentYear } },
              take: 1,
              orderBy: { id: "desc" },
              include: { constructor: true },
            },
          },
        },
      },
      orderBy: { position: "asc" },
    });

    drivers = standings.map((s) => ({
      driverId: s.driverId,
      firstName: s.driver.firstName,
      lastName: s.driver.lastName,
      number: s.driver.number,
      nationality: s.driver.nationality,
      position: s.position,
      points: s.points,
      constructorName: s.driver.results[0]?.constructor?.name ?? "Unknown",
      constructorColor:
        s.driver.results[0]?.constructor?.colorPrimary ?? null,
    }));
  } else {
    // No standings yet - show all drivers with qualifying position if available
    const allDrivers = await prisma.driver.findMany({
      where: {
        // Only drivers who are part of this season (have qualifying or results)
        OR: [
          { qualifyingResults: { some: { race: { season: currentYear } } } },
          { results: { some: { race: { season: currentYear } } } },
        ],
      },
      include: {
        qualifyingResults: {
          where: { race: { season: currentYear } },
          orderBy: { position: "asc" },
          take: 1,
          include: { constructor: true },
        },
      },
      orderBy: { lastName: "asc" },
    });

    // If we still have no drivers from qualifying/results, show all drivers in DB
    const driverList = allDrivers.length > 0 ? allDrivers : await prisma.driver.findMany({
      include: {
        qualifyingResults: {
          where: { race: { season: currentYear } },
          orderBy: { position: "asc" },
          take: 1,
          include: { constructor: true },
        },
      },
      orderBy: { lastName: "asc" },
    });

    drivers = driverList.map((d, i) => {
      const qualiResult = d.qualifyingResults[0];
      const constructorId = qualiResult?.constructorId;
      return {
        driverId: d.driverId,
        firstName: d.firstName,
        lastName: d.lastName,
        number: d.number,
        nationality: d.nationality,
        position: qualiResult?.position ?? i + 1,
        points: 0,
        constructorName: qualiResult?.constructor?.name ?? "TBA",
        constructorColor:
          qualiResult?.constructor?.colorPrimary ??
          (constructorId ? getTeamColor(constructorId) : null),
      };
    });

    // Sort by qualifying position
    drivers.sort((a, b) => a.position - b.position);
  }

  const hasStandings = !!latestRaceWithStandings;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Users size={28} className="text-f1-red" />
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white">
          {currentYear} Drivers
        </h1>
        {!hasStandings && drivers.length > 0 && (
          <span className="text-xs text-f1-white/30 bg-f1-carbon px-2 py-1 rounded">
            Qualifying Grid
          </span>
        )}
      </div>

      {drivers.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <Users size={48} className="text-f1-white/10 mb-4" />
          <p className="text-f1-white/40 text-lg mb-2">No driver data yet</p>
          <p className="text-f1-white/25 text-sm">
            Driver cards will appear here once standings data has been synced.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {drivers.map((driver, index) => (
            <DriverCard key={driver.driverId} driver={driver} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
