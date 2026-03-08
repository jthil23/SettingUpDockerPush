import { Swords } from "lucide-react";
import { prisma } from "@/lib/prisma";
import BattlesClient from "@/components/battles/BattlesClient";

export const dynamic = "force-dynamic";

export default async function BattlesPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonParam } = await searchParams;

  const seasonsRaw = await prisma.race.findMany({
    where: { results: { some: {} } },
    select: { season: true },
    distinct: ["season"],
    orderBy: { season: "desc" },
  });
  const availableSeasons = seasonsRaw.map((r) => r.season);
  const selectedSeason = seasonParam
    ? parseInt(seasonParam, 10)
    : availableSeasons[0] ?? new Date().getFullYear();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Swords size={20} className="text-f1-red" />
          <h1 className="font-heading text-2xl font-bold text-f1-white">Constructor Battles</h1>
        </div>
        <p className="text-sm text-f1-white/40">Teammate head-to-head battles across the {selectedSeason} season</p>
      </div>
      <div className="accent-line" />
      <BattlesClient availableSeasons={availableSeasons} selectedSeason={selectedSeason} />
    </div>
  );
}
