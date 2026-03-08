import Link from "next/link";
import { TrendingUp } from "lucide-react";

interface TimelineRace {
  round: number;
  raceName: string;
  date: string;
  isPast: boolean;
  isNext: boolean;
  winnerColor: string | null;
  winnerCode: string | null;
}

interface SeasonTimelineProps {
  races: TimelineRace[];
  season: number;
}

export default function SeasonTimeline({ races, season }: SeasonTimelineProps) {
  if (races.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} className="text-f1-cyan" />
        <h2 className="font-heading text-lg font-semibold text-f1-white">{season} Season</h2>
        <span className="text-xs text-f1-white/30 ml-auto">{races.filter((r) => r.isPast).length} / {races.length} races</span>
      </div>
      <div className="flex gap-1 items-end h-12">
        {races.map((race) => (
          <Link key={race.round} href={race.isPast ? `/results/${season}/${race.round}` : "/schedule"} className="flex-1 group relative" title={`R${race.round}: ${race.raceName}`}>
            <div className={`w-full rounded-t-sm transition-all duration-200 ${race.isNext ? "h-10 border-2 border-f1-red animate-pulse-glow" : race.isPast ? "h-8 hover:h-10" : "h-4 opacity-30"}`}
              style={{ backgroundColor: race.isPast ? race.winnerColor ?? "#3D3D3D" : race.isNext ? "#E10600" : "#2D2D2D" }} />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-f1-black border border-f1-carbon rounded px-1.5 py-0.5 text-[8px] text-f1-white/70 whitespace-nowrap hidden group-hover:block z-10 pointer-events-none">
              R{race.round} {race.winnerCode ?? ""}
            </div>
          </Link>
        ))}
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-f1-white/20 font-mono">
        <span>R1</span>
        <span>R{races.length}</span>
      </div>
    </div>
  );
}
