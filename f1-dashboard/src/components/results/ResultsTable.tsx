"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface ResultRow {
  id: number;
  grid: number | null;
  position: number | null;
  positionText: string | null;
  points: number;
  laps: number | null;
  status: string | null;
  fastestLapTime: string | null;
  fastestLapRank: number | null;
  driver: {
    driverId: string;
    firstName: string;
    lastName: string;
    code: string | null;
  };
  constructor: {
    constructorId: string;
    name: string;
    colorPrimary: string | null;
  };
}

interface ResultsTableProps {
  results: ResultRow[];
}

function PositionChange({ grid, position }: { grid: number | null; position: number | null }) {
  if (grid === null || position === null || grid === 0) {
    return <Minus size={14} className="text-f1-white/30" />;
  }

  const change = grid - position;

  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-mono font-semibold">
        <ArrowUp size={12} />
        {change}
      </span>
    );
  }

  if (change < 0) {
    return (
      <span className="flex items-center gap-0.5 text-red-400 text-xs font-mono font-semibold">
        <ArrowDown size={12} />
        {Math.abs(change)}
      </span>
    );
  }

  return <Minus size={14} className="text-f1-white/30" />;
}

function getPodiumBorderColor(position: number | null): string {
  switch (position) {
    case 1:
      return "border-l-yellow-500";
    case 2:
      return "border-l-gray-300";
    case 3:
      return "border-l-amber-700";
    default:
      return "border-l-transparent";
  }
}

function getPodiumTextStyle(position: number | null): string {
  switch (position) {
    case 1:
      return "text-yellow-500 font-bold";
    case 2:
      return "text-gray-300 font-bold";
    case 3:
      return "text-amber-700 font-bold";
    default:
      return "text-f1-white/70";
  }
}

export default function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="card flex items-center justify-center py-16">
        <p className="text-f1-white/30 text-sm">No race results available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-f1-carbon text-f1-white/40 text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-3 font-medium w-14">Pos</th>
            <th className="text-left py-3 px-2 font-medium w-14">Grid</th>
            <th className="text-center py-3 px-2 font-medium w-14">+/-</th>
            <th className="text-left py-3 px-3 font-medium">Driver</th>
            <th className="text-left py-3 px-3 font-medium hidden md:table-cell">Team</th>
            <th className="text-right py-3 px-3 font-medium w-16 hidden sm:table-cell">Laps</th>
            <th className="text-left py-3 px-3 font-medium hidden lg:table-cell">Status</th>
            <th className="text-right py-3 px-3 font-medium w-16">Pts</th>
            <th className="text-right py-3 px-3 font-medium hidden md:table-cell">Fastest Lap</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => {
            const isDNF = result.status !== null && result.status !== "Finished" && result.position === null;
            const podiumBorder = getPodiumBorderColor(result.position);
            const podiumText = getPodiumTextStyle(result.position);

            return (
              <motion.tr
                key={result.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className={`border-b border-f1-carbon/50 hover:bg-f1-carbon/20 transition-colors duration-150
                  border-l-2 ${podiumBorder} ${isDNF ? "opacity-50" : ""}`}
              >
                {/* Position */}
                <td className="py-3 px-3">
                  <span className={`font-mono text-sm ${podiumText}`}>
                    {result.positionText ?? "—"}
                  </span>
                </td>

                {/* Grid */}
                <td className="py-3 px-2">
                  <span className="font-mono text-sm text-f1-white/50">
                    {result.grid ?? "—"}
                  </span>
                </td>

                {/* Position Change */}
                <td className="py-3 px-2 text-center">
                  <div className="flex justify-center">
                    <PositionChange grid={result.grid} position={result.position} />
                  </div>
                </td>

                {/* Driver */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: result.constructor.colorPrimary || "#3D3D3D" }}
                    />
                    <span className="text-f1-white font-medium">
                      {result.driver.firstName} <span className="font-semibold">{result.driver.lastName}</span>
                    </span>
                  </div>
                </td>

                {/* Team */}
                <td className="py-3 px-3 text-f1-white/50 hidden md:table-cell">
                  {result.constructor.name}
                </td>

                {/* Laps */}
                <td className="py-3 px-3 text-right font-mono text-f1-white/50 hidden sm:table-cell">
                  {result.laps ?? "—"}
                </td>

                {/* Status */}
                <td className={`py-3 px-3 hidden lg:table-cell ${isDNF ? "text-red-400" : "text-f1-white/40"}`}>
                  {result.status ?? "—"}
                </td>

                {/* Points */}
                <td className="py-3 px-3 text-right font-mono text-f1-white/70 font-medium">
                  {result.points}
                </td>

                {/* Fastest Lap */}
                <td className="py-3 px-3 text-right hidden md:table-cell">
                  {result.fastestLapTime ? (
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded ${
                        result.fastestLapRank === 1
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "text-f1-white/40"
                      }`}
                    >
                      {result.fastestLapTime}
                    </span>
                  ) : (
                    <span className="text-f1-white/20">—</span>
                  )}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
