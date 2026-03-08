import Link from "next/link";
import { Trophy } from "lucide-react";

interface DriverStandingRow {
  position: number;
  name: string;
  points: number;
  color: string | null;
}

interface ConstructorStandingRow {
  position: number;
  name: string;
  points: number;
  color: string | null;
}

type StandingRow = DriverStandingRow | ConstructorStandingRow;

interface MiniStandingsProps {
  type: "drivers" | "constructors";
  standings: StandingRow[];
  label?: string;
}

function positionAccent(position: number): string {
  if (position === 1) return "text-yellow-400";
  if (position === 2) return "text-gray-300";
  if (position === 3) return "text-amber-600";
  return "text-f1-white/50";
}

function positionBg(position: number): string {
  if (position === 1)
    return "bg-yellow-400/5 border-l-2 border-l-yellow-400/40";
  if (position === 2)
    return "bg-gray-300/5 border-l-2 border-l-gray-300/30";
  if (position === 3)
    return "bg-amber-600/5 border-l-2 border-l-amber-600/30";
  return "border-l-2 border-l-transparent";
}

export default function MiniStandings({ type, standings, label }: MiniStandingsProps) {
  const title = label
    ? label
    : type === "drivers" ? "Driver Standings" : "Constructor Standings";
  const linkHref = "/standings";

  if (standings.length === 0) {
    return (
      <div className="card flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-f1-red" />
          <h2 className="font-heading text-lg font-semibold text-f1-white">
            {title}
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-f1-white/30 text-sm">No data synced yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} className="text-f1-red" />
        <h2 className="font-heading text-lg font-semibold text-f1-white">
          {title}
        </h2>
      </div>

      <div className="flex flex-col gap-0.5 flex-1">
        {standings.map((row) => (
          <div
            key={row.position}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-f1-carbon/50 ${positionBg(row.position)}`}
          >
            {/* Position */}
            <span
              className={`font-mono text-sm font-bold w-6 text-right tabular-nums ${positionAccent(row.position)}`}
            >
              {row.position}
            </span>

            {/* Team color dot */}
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: row.color || "#3D3D3D" }}
            />

            {/* Name */}
            <span className="text-sm text-f1-white flex-1 truncate">
              {row.name}
            </span>

            {/* Points */}
            <span className="font-mono text-sm text-f1-white/70 tabular-nums">
              {row.points}
            </span>
          </div>
        ))}
      </div>

      <Link
        href={linkHref}
        className="mt-4 text-xs text-f1-red hover:text-f1-red/80 transition-colors flex items-center gap-1"
      >
        View Full Standings
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
}
