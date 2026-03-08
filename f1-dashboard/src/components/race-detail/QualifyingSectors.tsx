"use client";
import { motion } from "framer-motion";

interface DriverSectors { driverCode: string; teamColor: string; position: number; s1: number | null; s2: number | null; s3: number | null; totalTime: number | null; speedTrap: number | null; }
interface QualifyingSectorsProps { drivers: DriverSectors[]; bestS1: number; bestS2: number; bestS3: number; }

function getSectorColor(time: number | null, best: number): string {
  if (time === null) return "bg-f1-gray/40";
  if (time <= best) return "bg-purple-500";
  if (time <= best * 1.003) return "bg-green-500";
  return "bg-yellow-400";
}

export default function QualifyingSectors({ drivers, bestS1, bestS2, bestS3 }: QualifyingSectorsProps) {
  if (drivers.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No sector data available</p>
      </div>
    );
  }
  const maxTotal = Math.max(...drivers.filter((d) => d.totalTime).map((d) => d.totalTime!));
  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-2">Qualifying Sectors</h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-purple-500" /><span className="text-[10px] text-f1-white/50">Overall Best</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500" /><span className="text-[10px] text-f1-white/50">Personal Best</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-yellow-400" /><span className="text-[10px] text-f1-white/50">Slower</span></div>
      </div>
      <div className="flex flex-col gap-1">
        {drivers.map((driver, i) => {
          const total = driver.totalTime ?? maxTotal;
          return (
            <div key={driver.driverCode} className="flex items-center gap-2">
              <div className="w-6 text-right shrink-0"><span className="text-[10px] text-f1-white/40 font-mono">P{driver.position}</span></div>
              <div className="w-10 shrink-0"><span className="text-xs font-bold text-f1-white/80 font-mono">{driver.driverCode}</span></div>
              <div className="flex-1 flex h-6 rounded-sm overflow-hidden">
                {[{ time: driver.s1, best: bestS1 }, { time: driver.s2, best: bestS2 }, { time: driver.s3, best: bestS3 }].map((sector, si) => {
                  const widthPct = sector.time ? (sector.time / total) * 100 : 33;
                  return (
                    <motion.div key={si} className={`${getSectorColor(sector.time, sector.best)} flex items-center justify-center border-r border-f1-black/30`} style={{ width: `${widthPct}%` }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, delay: i * 0.03 }}>
                      <span className="text-[8px] font-mono font-bold text-black/70">{sector.time?.toFixed(3) ?? "-"}</span>
                    </motion.div>
                  );
                })}
              </div>
              {driver.speedTrap && <span className="text-[10px] font-mono text-f1-white/40 w-14 text-right shrink-0">{driver.speedTrap} km/h</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
