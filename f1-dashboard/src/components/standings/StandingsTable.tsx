"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export interface DriverStandingRow {
  position: number;
  driverId: string;
  firstName: string;
  lastName: string;
  points: number;
  wins: number;
  podiums: number;
  color: string | null;
  constructorName: string;
}

export interface ConstructorStandingRow {
  position: number;
  constructorId: string;
  name: string;
  points: number;
  wins: number;
  podiums: number;
  color: string | null;
}

type StandingsTableProps =
  | { type: "drivers"; standings: DriverStandingRow[] }
  | { type: "constructors"; standings: ConstructorStandingRow[] };

function positionAccent(position: number): string {
  if (position === 1) return "text-yellow-400";
  if (position === 2) return "text-gray-300";
  if (position === 3) return "text-amber-600";
  return "text-f1-white/50";
}

function positionBg(position: number): string {
  if (position === 1) return "border-l-2 border-l-yellow-400/60";
  if (position === 2) return "border-l-2 border-l-gray-300/40";
  if (position === 3) return "border-l-2 border-l-amber-600/40";
  return "border-l-2 border-l-transparent";
}

export default function StandingsTable(props: StandingsTableProps) {
  const { type, standings } = props;

  if (standings.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No standings available</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-[3rem_1fr_4rem_3.5rem_4rem] md:grid-cols-[3.5rem_1fr_5rem_4rem_5rem] gap-2 px-3 md:px-4 py-3 border-b border-f1-carbon text-xs font-heading font-semibold text-f1-white/40 uppercase tracking-wider min-w-[360px]">
        <span>Pos</span>
        <span>{type === "drivers" ? "Driver" : "Team"}</span>
        <span className="text-right">Pts</span>
        <span className="text-right">Wins</span>
        <span className="text-right">Podiums</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-f1-carbon/50">
        {standings.map((row, index) => {
          const content = (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className={`grid grid-cols-[3rem_1fr_4rem_3.5rem_4rem] md:grid-cols-[3.5rem_1fr_5rem_4rem_5rem] gap-2 px-3 md:px-4 py-3 items-center transition-colors hover:bg-f1-carbon/30 min-w-[360px] ${positionBg(row.position)}`}
            >
              {/* Position */}
              <span
                className={`font-mono text-sm font-bold tabular-nums ${positionAccent(row.position)}`}
              >
                {row.position}
              </span>

              {/* Name */}
              <div className="flex items-center gap-3 min-w-0">
                {type === "drivers" ? (
                  <>
                    <span
                      className="w-1 h-8 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          (row as DriverStandingRow).color || "#3D3D3D",
                      }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-f1-white truncate">
                        {(row as DriverStandingRow).firstName}{" "}
                        <span className="font-bold uppercase">
                          {(row as DriverStandingRow).lastName}
                        </span>
                      </span>
                      <span className="text-xs text-f1-white/30 truncate">
                        {(row as DriverStandingRow).constructorName}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span
                      className="w-1 h-8 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          (row as ConstructorStandingRow).color || "#3D3D3D",
                      }}
                    />
                    <div
                      className="flex items-center gap-2 px-3 py-1 rounded-md min-w-0"
                      style={{
                        background: `linear-gradient(90deg, ${(row as ConstructorStandingRow).color || "#3D3D3D"}15, transparent)`,
                      }}
                    >
                      <span className="text-sm text-f1-white font-medium truncate">
                        {(row as ConstructorStandingRow).name}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Points */}
              <span className="font-mono text-sm text-f1-white tabular-nums text-right font-semibold">
                {row.points}
              </span>

              {/* Wins */}
              <span className="font-mono text-sm text-f1-white/60 tabular-nums text-right">
                {row.wins}
              </span>

              {/* Podiums */}
              <span className="font-mono text-sm text-f1-white/60 tabular-nums text-right">
                {row.podiums}
              </span>
            </motion.div>
          );

          if (type === "drivers") {
            return (
              <Link
                key={(row as DriverStandingRow).driverId}
                href={`/drivers/${(row as DriverStandingRow).driverId}`}
                className="block"
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={(row as ConstructorStandingRow).constructorId}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
