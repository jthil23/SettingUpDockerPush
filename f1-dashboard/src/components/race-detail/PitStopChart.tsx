"use client";
import { motion } from "framer-motion";

interface PitStop { driverId: string; driverCode: string; teamColor: string; lap: number; stop: number; duration: string; }
interface PitStopChartProps { pitStops: PitStop[]; }

export default function PitStopChart({ pitStops }: PitStopChartProps) {
  if (pitStops.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No pit stop data available</p>
      </div>
    );
  }
  const sorted = [...pitStops].map((ps) => ({ ...ps, durationNum: parseFloat(ps.duration) || 0 })).filter((ps) => ps.durationNum > 0 && ps.durationNum < 120).sort((a, b) => a.durationNum - b.durationNum);
  const maxDuration = Math.min(sorted[sorted.length - 1]?.durationNum ?? 40, 60);
  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">Pit Stops</h3>
      <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto">
        {sorted.map((ps, i) => {
          const widthPct = (ps.durationNum / maxDuration) * 100;
          const isFastest = i === 0;
          return (
            <div key={`${ps.driverId}-${ps.stop}`} className="flex items-center gap-2">
              <div className="w-10 text-right shrink-0"><span className="text-[10px] text-f1-white/40 font-mono">L{ps.lap}</span></div>
              <div className="w-10 shrink-0"><span className="text-xs font-bold text-f1-white/80 font-mono">{ps.driverCode}</span></div>
              <div className="flex-1 flex items-center gap-2">
                <motion.div className="h-5 rounded-r-sm flex items-center justify-end pr-2" style={{ backgroundColor: ps.teamColor || "#3D3D3D", width: `${widthPct}%`, minWidth: "40px" }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, delay: i * 0.03, ease: "easeOut" }}>
                  <span className={`text-[10px] font-mono font-bold ${isFastest ? "text-f1-yellow" : "text-f1-white/90"}`}>{ps.duration}s</span>
                </motion.div>
              </div>
              {isFastest && <span className="text-[9px] text-f1-yellow font-bold uppercase tracking-wider shrink-0">Fastest</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
