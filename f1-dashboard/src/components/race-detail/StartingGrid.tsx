"use client";
import { motion } from "framer-motion";

interface GridDriver { position: number; driverCode: string; driverName: string; constructorName: string; teamColor: string; q3Time?: string | null; }
interface StartingGridProps { drivers: GridDriver[]; }

export default function StartingGrid({ drivers }: StartingGridProps) {
  if (drivers.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No qualifying data available</p>
      </div>
    );
  }
  const rows: [GridDriver | null, GridDriver | null][] = [];
  for (let i = 0; i < drivers.length; i += 2) {
    rows.push([drivers[i] ?? null, drivers[i + 1] ?? null]);
  }
  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">Starting Grid</h3>
      <div className="relative max-w-md mx-auto">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-f1-gray/20 -translate-x-1/2" />
        <div className="flex flex-col gap-1">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-2 items-center">
              {row[0] ? (
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: rowIdx * 0.08 }} className="flex-1 flex items-center gap-2 rounded-lg border border-f1-gray/20 px-3 py-2 bg-f1-carbon/20" style={{ borderLeftColor: row[0].teamColor, borderLeftWidth: 3 }}>
                  <span className="font-mono text-sm font-bold text-f1-white/50 w-6 text-center">{row[0].position}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-f1-white truncate">{row[0].driverCode}</p><p className="text-[10px] text-f1-white/40 truncate">{row[0].constructorName}</p></div>
                  {row[0].q3Time && <span className="text-[10px] font-mono text-f1-white/30">{row[0].q3Time}</span>}
                </motion.div>
              ) : <div className="flex-1" />}
              {row[1] ? (
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: rowIdx * 0.08 + 0.04 }} className="flex-1 flex items-center gap-2 rounded-lg border border-f1-gray/20 px-3 py-2 bg-f1-carbon/20 mt-3" style={{ borderLeftColor: row[1].teamColor, borderLeftWidth: 3 }}>
                  <span className="font-mono text-sm font-bold text-f1-white/50 w-6 text-center">{row[1].position}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-f1-white truncate">{row[1].driverCode}</p><p className="text-[10px] text-f1-white/40 truncate">{row[1].constructorName}</p></div>
                  {row[1].q3Time && <span className="text-[10px] font-mono text-f1-white/30">{row[1].q3Time}</span>}
                </motion.div>
              ) : <div className="flex-1" />}
            </div>
          ))}
        </div>
        <div className="mt-4 h-1 w-full bg-gradient-to-r from-transparent via-f1-white/30 to-transparent rounded-full" />
        <p className="text-center text-[10px] text-f1-white/30 mt-1 uppercase tracking-widest">Start / Finish</p>
      </div>
    </div>
  );
}
