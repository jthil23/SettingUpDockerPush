"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Target, Zap } from "lucide-react";

interface DriverStats {
  driverId: string;
  name: string;
  code: string | null;
  teamColor: string | null;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  dnfs: number;
  races: number;
  bestFinish: number | null;
  avgQualPos: number | null;
  avgFinishPos: number | null;
}

interface ComparisonStatsProps {
  driver1Stats: DriverStats;
  driver2Stats: DriverStats;
}

interface StatRowProps {
  label: string;
  icon: React.ReactNode;
  value1: number | null;
  value2: number | null;
  color1: string;
  color2: string;
  lowerIsBetter?: boolean;
}

function StatRow({
  label,
  icon,
  value1,
  value2,
  color1,
  color2,
  lowerIsBetter = false,
}: StatRowProps) {
  const v1 = value1 ?? 0;
  const v2 = value2 ?? 0;
  const max = Math.max(v1, v2, 1);
  const pct1 = (v1 / max) * 100;
  const pct2 = (v2 / max) * 100;

  const winner1 = lowerIsBetter
    ? v1 < v2 && value1 !== null
    : v1 > v2;
  const winner2 = lowerIsBetter
    ? v2 < v1 && value2 !== null
    : v2 > v1;

  const formatValue = (val: number | null) => {
    if (val === null) return "N/A";
    return Number.isInteger(val) ? val.toString() : val.toFixed(1);
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-f1-carbon/50 last:border-b-0">
      {/* Driver 1 value */}
      <div className="w-16 text-right">
        <span
          className={`font-mono text-sm ${
            winner1
              ? "text-f1-white font-bold text-base"
              : "text-f1-white/50"
          }`}
        >
          {formatValue(value1)}
        </span>
      </div>

      {/* Bars */}
      <div className="flex-1 flex items-center gap-1">
        {/* Left bar (driver 1) - grows from right to left */}
        <div className="flex-1 flex justify-end">
          <motion.div
            className="h-6 rounded-l-sm"
            style={{ backgroundColor: color1 }}
            initial={{ width: 0 }}
            animate={{ width: `${pct1}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        {/* Center label */}
        <div className="flex items-center gap-1.5 px-2 min-w-[120px] justify-center">
          <span className="text-f1-white/30">{icon}</span>
          <span className="text-xs font-heading font-semibold text-f1-white/60 uppercase tracking-wide whitespace-nowrap">
            {label}
          </span>
        </div>

        {/* Right bar (driver 2) - grows from left to right */}
        <div className="flex-1">
          <motion.div
            className="h-6 rounded-r-sm"
            style={{ backgroundColor: color2 }}
            initial={{ width: 0 }}
            animate={{ width: `${pct2}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Driver 2 value */}
      <div className="w-16">
        <span
          className={`font-mono text-sm ${
            winner2
              ? "text-f1-white font-bold text-base"
              : "text-f1-white/50"
          }`}
        >
          {formatValue(value2)}
        </span>
      </div>
    </div>
  );
}

export default function ComparisonStats({
  driver1Stats,
  driver2Stats,
}: ComparisonStatsProps) {
  const color1 = driver1Stats.teamColor ?? "#E10600";
  const color2 = driver2Stats.teamColor ?? "#00D2BE";

  const stats: Omit<StatRowProps, "color1" | "color2">[] = [
    {
      label: "Wins",
      icon: <Trophy size={14} />,
      value1: driver1Stats.wins,
      value2: driver2Stats.wins,
    },
    {
      label: "Podiums",
      icon: <Medal size={14} />,
      value1: driver1Stats.podiums,
      value2: driver2Stats.podiums,
    },
    {
      label: "Poles",
      icon: <Target size={14} />,
      value1: driver1Stats.poles,
      value2: driver2Stats.poles,
    },
    {
      label: "Points",
      icon: <Zap size={14} />,
      value1: driver1Stats.points,
      value2: driver2Stats.points,
    },
    {
      label: "DNFs",
      icon: <Zap size={14} />,
      value1: driver1Stats.dnfs,
      value2: driver2Stats.dnfs,
      lowerIsBetter: true,
    },
    {
      label: "Best Finish",
      icon: <Trophy size={14} />,
      value1: driver1Stats.bestFinish,
      value2: driver2Stats.bestFinish,
      lowerIsBetter: true,
    },
    {
      label: "Avg Qual",
      icon: <Target size={14} />,
      value1: driver1Stats.avgQualPos,
      value2: driver2Stats.avgQualPos,
      lowerIsBetter: true,
    },
    {
      label: "Avg Finish",
      icon: <Medal size={14} />,
      value1: driver1Stats.avgFinishPos,
      value2: driver2Stats.avgFinishPos,
      lowerIsBetter: true,
    },
  ];

  return (
    <div className="card">
      {/* Header with driver names */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-f1-carbon">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color1 }}
          />
          <span className="font-heading font-bold text-f1-white">
            {driver1Stats.code ?? driver1Stats.name.split(" ").pop()}
          </span>
        </div>
        <span className="text-xs font-heading text-f1-white/30 uppercase tracking-widest">
          VS
        </span>
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-f1-white">
            {driver2Stats.code ?? driver2Stats.name.split(" ").pop()}
          </span>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color2 }}
          />
        </div>
      </div>

      {/* Stat rows */}
      {stats.map((stat) => (
        <StatRow
          key={stat.label}
          {...stat}
          color1={color1}
          color2={color2}
        />
      ))}
    </div>
  );
}
