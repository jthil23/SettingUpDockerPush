"use client";

import { getCountryFlag } from "@/lib/country-flags";

interface RaceOption {
  id: number;
  round: number;
  raceName: string;
  country: string;
  season: number;
}

interface RaceSelectorProps {
  races: RaceOption[];
  selectedRaceId: number;
  onChange: (raceId: number) => void;
}

export default function RaceSelector({
  races,
  selectedRaceId,
  onChange,
}: RaceSelectorProps) {
  return (
    <select
      value={selectedRaceId}
      onChange={(e) => onChange(Number(e.target.value))}
      className="bg-f1-dark border border-f1-carbon text-f1-white px-4 py-2.5 rounded-lg text-sm font-medium
        focus:outline-none focus:border-f1-red transition-colors duration-200
        appearance-none cursor-pointer
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23F0F0F0%22%20stroke-width%3D%222%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')]
        bg-[position:right_12px_center] bg-no-repeat pr-10"
    >
      {races.map((race) => (
        <option key={race.id} value={race.id}>
          {getCountryFlag(race.country)} R{race.round} - {race.raceName}
        </option>
      ))}
    </select>
  );
}
