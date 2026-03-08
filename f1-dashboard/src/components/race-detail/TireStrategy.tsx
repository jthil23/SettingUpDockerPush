"use client";
import { motion } from "framer-motion";

interface Stint { compound: string; lapStart: number; lapEnd: number; tyreAge: number; }
interface DriverStints { driverNumber: number; abbreviation: string; teamColor: string; stints: Stint[]; }
interface TireStrategyProps { drivers: DriverStints[]; totalLaps: number; }

const compoundColors: Record<string, { bg: string; text: string }> = {
  SOFT: { bg: "bg-red-500", text: "text-white" },
  MEDIUM: { bg: "bg-yellow-400", text: "text-black" },
  HARD: { bg: "bg-white", text: "text-black" },
  INTERMEDIATE: { bg: "bg-green-500", text: "text-white" },
  WET: { bg: "bg-blue-500", text: "text-white" },
  UNKNOWN: { bg: "bg-gray-500", text: "text-white" },
};

export default function TireStrategy({ drivers, totalLaps }: TireStrategyProps) {
  if (drivers.length === 0 || totalLaps === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No tire strategy data available</p>
      </div>
    );
  }
  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">Tire Strategy</h3>
      <div className="flex items-center gap-3 mb-4">
        {Object.entries(compoundColors).filter(([k]) => k !== "UNKNOWN").map(([compound, colors]) => (
          <div key={compound} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${colors.bg}`} />
            <span className="text-[10px] text-f1-white/50 uppercase">{compound}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center mb-1 pl-14">
        <div className="flex-1 flex justify-between text-[9px] text-f1-white/30 font-mono">
          <span>1</span><span>{Math.floor(totalLaps / 4)}</span><span>{Math.floor(totalLaps / 2)}</span><span>{Math.floor((totalLaps * 3) / 4)}</span><span>{totalLaps}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {drivers.map((driver, driverIdx) => (
          <div key={driver.driverNumber} className="flex items-center gap-2">
            <div className="w-12 flex items-center gap-1.5 shrink-0">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: driver.teamColor }} />
              <span className="text-xs font-bold text-f1-white/80 font-mono">{driver.abbreviation}</span>
            </div>
            <div className="flex-1 flex h-7 rounded-sm overflow-hidden bg-f1-carbon/30">
              {driver.stints.map((stint, i) => {
                const widthPct = ((stint.lapEnd - stint.lapStart + 1) / totalLaps) * 100;
                const compound = stint.compound.toUpperCase();
                const compColor = compoundColors[compound] ?? compoundColors.UNKNOWN;
                return (
                  <motion.div key={i} className={`${compColor.bg} flex items-center justify-center border-r border-f1-black/30 relative group`} style={{ width: `${widthPct}%` }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: driverIdx * 0.02 + i * 0.1, ease: "easeOut" }}>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${compColor.text}`}>{compound.charAt(0)}</span>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-f1-black border border-f1-carbon rounded px-2 py-1 text-[9px] text-f1-white/70 whitespace-nowrap hidden group-hover:block z-10 pointer-events-none">
                      {compound} L{stint.lapStart}-{stint.lapEnd} ({stint.tyreAge} laps old)
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
