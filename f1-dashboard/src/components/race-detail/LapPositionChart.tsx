"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface LapPosition {
  lap: number;
  positions: Record<string, number>;
}

interface DriverInfo {
  driverId: string;
  code: string;
  color: string;
}

interface LapPositionChartProps {
  data: LapPosition[];
  drivers: DriverInfo[];
  totalLaps: number;
}

interface TooltipPayloadItem { name: string; value: number; color: string; }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const sorted = [...payload].sort((a, b) => a.value - b.value);
  return (
    <div className="rounded-lg border border-f1-carbon px-4 py-3 shadow-xl bg-f1-black max-h-80 overflow-y-auto">
      <p className="text-xs text-f1-white/50 font-heading mb-2">Lap {label}</p>
      <div className="flex flex-col gap-0.5">
        {sorted.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span className="font-mono text-f1-white/40 w-5 text-right">P{entry.value}</span>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-f1-white/70">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LapPositionChart({ data, drivers, totalLaps }: LapPositionChartProps) {
  if (data.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No lap data available</p>
      </div>
    );
  }
  const chartData = data.map((lap) => ({ lap: lap.lap, ...lap.positions }));
  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">Position Changes</h3>
      <div className="w-full" style={{ height: Math.max(400, drivers.length * 22) }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
            <XAxis dataKey="lap" stroke="#F0F0F0" tick={{ fontSize: 10, fill: "#F0F0F0" }} tickLine={false} axisLine={{ stroke: "#2D2D2D" }} interval={Math.floor(totalLaps / 10)} />
            <YAxis reversed domain={[1, drivers.length]} stroke="#F0F0F0" tick={{ fontSize: 10, fill: "#F0F0F0" }} tickLine={false} axisLine={{ stroke: "#2D2D2D" }} width={35} allowDecimals={false} tickCount={drivers.length} />
            <Tooltip content={<CustomTooltip />} />
            {drivers.map((driver) => (
              <Line key={driver.driverId} type="linear" dataKey={driver.driverId} name={driver.code} stroke={driver.color} strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} connectNulls={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-4 px-2">
        {drivers.map((driver) => (
          <div key={driver.driverId} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full shrink-0" style={{ backgroundColor: driver.color }} />
            <span className="text-[10px] text-f1-white/60">{driver.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
