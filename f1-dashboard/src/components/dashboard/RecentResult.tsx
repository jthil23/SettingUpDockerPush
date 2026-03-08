import Link from "next/link";
import { Flag, Zap } from "lucide-react";

interface PodiumDriver {
  position: number;
  firstName: string;
  lastName: string;
  constructorName: string;
  constructorColor: string | null;
  time: string | null;
  gap: string | null;
}

interface FastestLapInfo {
  driverName: string;
  time: string;
}

interface RecentResultProps {
  raceName: string | null;
  circuitName: string | null;
  raceId: number | null;
  podium: PodiumDriver[];
  fastestLap: FastestLapInfo | null;
}

function PodiumBlock({
  driver,
  height,
}: {
  driver: PodiumDriver;
  height: string;
}) {
  const posLabel = `P${driver.position}`;

  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      {/* Driver info */}
      <div className="text-center">
        <p className="text-xs text-f1-white/50 font-mono">{posLabel}</p>
        <p className="text-sm font-semibold text-f1-white truncate">
          {driver.lastName}
        </p>
        <p className="text-[11px] text-f1-white/40 truncate">
          {driver.constructorName}
        </p>
        <p className="text-[11px] font-mono text-f1-white/50 mt-0.5">
          {driver.position === 1
            ? driver.time || ""
            : driver.gap
              ? `+${driver.gap}`
              : ""}
        </p>
      </div>
      {/* Podium block */}
      <div
        className="w-full rounded-t-md border border-b-0"
        style={{
          height,
          borderColor: driver.constructorColor || "#3D3D3D",
          background: `linear-gradient(to top, ${driver.constructorColor || "#3D3D3D"}20, transparent)`,
        }}
      >
        <div className="flex items-center justify-center h-full">
          <span className="font-heading text-2xl font-bold text-f1-white/70">
            {driver.position}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RecentResult({
  raceName,
  circuitName,
  raceId,
  podium,
  fastestLap,
}: RecentResultProps) {
  if (!raceName || podium.length === 0) {
    return (
      <div className="card flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Flag size={18} className="text-f1-red" />
          <h2 className="font-heading text-lg font-semibold text-f1-white">
            Recent Result
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-f1-white/30 text-sm">No results available yet</p>
        </div>
      </div>
    );
  }

  // Arrange podium: P2 (left), P1 (center), P3 (right)
  const p1 = podium.find((d) => d.position === 1);
  const p2 = podium.find((d) => d.position === 2);
  const p3 = podium.find((d) => d.position === 3);

  return (
    <div className="card flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Flag size={18} className="text-f1-red" />
        <h2 className="font-heading text-lg font-semibold text-f1-white">
          Recent Result
        </h2>
      </div>
      <p className="text-xs text-f1-white/40 mb-6">
        {raceName}
        {circuitName ? ` — ${circuitName}` : ""}
      </p>

      {/* Podium */}
      <div className="flex items-end gap-2 mb-6 px-2">
        {p2 && <PodiumBlock driver={p2} height="80px" />}
        {p1 && <PodiumBlock driver={p1} height="110px" />}
        {p3 && <PodiumBlock driver={p3} height="64px" />}
      </div>

      {/* Fastest Lap */}
      {fastestLap && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-purple-500/10 border border-purple-500/20">
          <Zap size={14} className="text-purple-400 shrink-0" />
          <span className="text-xs text-purple-300">Fastest Lap</span>
          <span className="text-xs text-f1-white/70 ml-auto truncate">
            {fastestLap.driverName}
          </span>
          <span className="text-xs font-mono text-purple-300">
            {fastestLap.time}
          </span>
        </div>
      )}

      {/* Link */}
      <Link
        href={raceId ? `/results` : "/results"}
        className="mt-4 text-xs text-f1-red hover:text-f1-red/80 transition-colors flex items-center gap-1"
      >
        View Full Results
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
}
