"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Zap } from "lucide-react";

interface DriverBattle { code: string; name: string; raceWins: number; qualiWins: number; points: number; }

interface TeamBattleCardProps {
  constructorName: string;
  colorPrimary: string;
  colorSecondary: string;
  driver1: DriverBattle;
  driver2: DriverBattle;
  totalRaces: number;
  index: number;
}

function BattleBar({ v1, v2, color }: { v1: number; v2: number; color: string }) {
  const total = v1 + v2 || 1;
  const pct1 = (v1 / total) * 100;
  const pct2 = (v2 / total) * 100;
  return (
    <div className="flex-1 flex h-4 rounded-sm overflow-hidden bg-f1-carbon/30">
      <motion.div className="h-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${pct1}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
      <motion.div className="h-full opacity-40" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${pct2}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
    </div>
  );
}

export default function TeamBattleCard({ constructorName, colorPrimary, colorSecondary, driver1, driver2, totalRaces, index }: TeamBattleCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.08 }} className="card overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${colorPrimary}, ${colorSecondary || colorPrimary})` }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-base font-bold text-f1-white">{constructorName}</h3>
          <span className="text-[10px] text-f1-white/30 font-mono">{totalRaces} races</span>
        </div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-f1-carbon">
          <span className="text-sm font-bold text-f1-white">{driver1.code}</span>
          <span className="text-[10px] text-f1-white/30 uppercase tracking-widest">VS</span>
          <span className="text-sm font-bold text-f1-white">{driver2.code}</span>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { label: "Race", icon: <Trophy size={10} />, v1: driver1.raceWins, v2: driver2.raceWins },
            { label: "Qualifying", icon: <Target size={10} />, v1: driver1.qualiWins, v2: driver2.qualiWins },
            { label: "Points", icon: <Zap size={10} />, v1: driver1.points, v2: driver2.points },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-[10px] text-f1-white/40 uppercase tracking-wider mb-1 flex items-center gap-1">{stat.icon} {stat.label}</p>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs w-6 text-right ${stat.v1 > stat.v2 ? "text-f1-white font-bold" : "text-f1-white/40"}`}>{stat.v1}</span>
                <BattleBar v1={stat.v1} v2={stat.v2} color={colorPrimary} />
                <span className={`font-mono text-xs w-6 ${stat.v2 > stat.v1 ? "text-f1-white font-bold" : "text-f1-white/40"}`}>{stat.v2}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
