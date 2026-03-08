"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TeamBattleCard from "./TeamBattleCard";

interface BattlesClientProps {
  availableSeasons: number[];
  selectedSeason: number;
}

export default function BattlesClient({ availableSeasons, selectedSeason }: BattlesClientProps) {
  const router = useRouter();
  const [battles, setBattles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/battles?season=${selectedSeason}`)
      .then((r) => r.json())
      .then((data) => setBattles(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedSeason]);

  const seasonSelector = (
    <select
      value={selectedSeason}
      onChange={(e) => router.push(`/battles?season=${e.target.value}`)}
      className="bg-f1-dark border border-f1-carbon text-f1-white px-3 py-2 rounded-lg text-sm font-mono font-bold
        focus:outline-none focus:border-f1-red transition-colors duration-200
        appearance-none cursor-pointer
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23F0F0F0%22%20stroke-width%3D%222%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')]
        bg-[position:right_8px_center] bg-no-repeat pr-8"
    >
      {availableSeasons.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-end">{seasonSelector}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">{seasonSelector}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {battles.map((battle: any, i: number) => (
        <TeamBattleCard
          key={battle.constructorId}
          constructorName={battle.constructorName}
          colorPrimary={battle.colorPrimary ?? "#3D3D3D"}
          colorSecondary={battle.colorSecondary ?? battle.colorPrimary ?? "#3D3D3D"}
          driver1={battle.driver1}
          driver2={battle.driver2}
          totalRaces={battle.totalRaces}
          index={i}
        />
      ))}
      </div>
    </div>
  );
}
