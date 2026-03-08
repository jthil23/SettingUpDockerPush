import { prisma } from "@/lib/prisma";
import { getTeamColor } from "@/lib/team-colors";
import H2HClient from "@/components/h2h/H2HClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Head-to-Head | F1 Dashboard",
  description: "Compare two drivers side by side",
};

export default async function HeadToHeadPage() {
  const currentYear = new Date().getFullYear();

  // Get all drivers who have results this season (active drivers)
  let driversWithResults = await prisma.driver.findMany({
    where: {
      results: {
        some: {
          race: { season: currentYear },
        },
      },
    },
    include: {
      results: {
        where: { race: { season: currentYear } },
        take: 1,
        orderBy: { id: "desc" },
        include: {
          constructor: true,
        },
      },
    },
    orderBy: { lastName: "asc" },
  });

  // If no race results yet, use qualifying data to populate driver list
  if (driversWithResults.length === 0) {
    const driversWithQualifying = await prisma.driver.findMany({
      where: {
        qualifyingResults: {
          some: {
            race: { season: currentYear },
          },
        },
      },
      include: {
        qualifyingResults: {
          where: { race: { season: currentYear } },
          take: 1,
          orderBy: { id: "desc" },
          include: { constructor: true },
        },
      },
      orderBy: { lastName: "asc" },
    });

    const drivers = driversWithQualifying.map((d) => ({
      driverId: d.driverId,
      firstName: d.firstName,
      lastName: d.lastName,
      code: d.code,
      teamColor: d.qualifyingResults[0]?.constructor?.colorPrimary ?? getTeamColor(d.qualifyingResults[0]?.constructorId ?? ""),
      teamName: d.qualifyingResults[0]?.constructor?.name ?? null,
    }));

    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white">
          Head-to-Head
        </h1>
        <H2HClient drivers={drivers} season={currentYear} />
      </div>
    );
  }

  const drivers = driversWithResults.map((d) => ({
    driverId: d.driverId,
    firstName: d.firstName,
    lastName: d.lastName,
    code: d.code,
    teamColor: d.results[0]?.constructor?.colorPrimary ?? null,
    teamName: d.results[0]?.constructor?.name ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white">
        Head-to-Head
      </h1>
      <H2HClient drivers={drivers} season={currentYear} />
    </div>
  );
}
