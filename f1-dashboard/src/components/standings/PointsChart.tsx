"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProgressionEntry {
  id: string;
  name: string;
  color: string;
  data: { round: number; raceName: string; points: number }[];
}

interface PointsChartProps {
  progression: ProgressionEntry[];
  rounds: { round: number; raceName: string }[];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-lg border border-f1-carbon px-4 py-3 shadow-xl"
      style={{ backgroundColor: "#0D0D0D" }}
    >
      <p className="text-xs text-f1-white/50 font-heading mb-2">{label}</p>
      <div className="flex flex-col gap-1">
        {payload
          .sort((a, b) => b.value - a.value)
          .map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-f1-white/70 flex-1">{entry.name}</span>
              <span className="font-mono text-f1-white font-semibold tabular-nums">
                {entry.value}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function PointsChart({
  progression,
  rounds,
}: PointsChartProps) {
  if (progression.length === 0 || rounds.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">
          No progression data available
        </p>
      </div>
    );
  }

  // Transform data for Recharts: each round becomes a data point with all drivers/constructors
  const chartData = rounds.map((round) => {
    const point: Record<string, string | number> = {
      name: `R${round.round}`,
      fullName: round.raceName,
    };

    for (const entry of progression) {
      const roundData = entry.data.find((d) => d.round === round.round);
      point[entry.id] = roundData?.points ?? 0;
    }

    return point;
  });

  return (
    <div
      className="card p-4 overflow-hidden"
      style={{ backgroundColor: "#1A1A1A" }}
    >
      <div className="w-full" style={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2D2D2D"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#F0F0F0"
              tick={{ fontSize: 11, fill: "#F0F0F0" }}
              tickLine={false}
              axisLine={{ stroke: "#2D2D2D" }}
            />
            <YAxis
              stroke="#F0F0F0"
              tick={{ fontSize: 11, fill: "#F0F0F0" }}
              tickLine={false}
              axisLine={{ stroke: "#2D2D2D" }}
              width={50}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#3D3D3D", strokeDasharray: "4 4" }}
            />
            {progression.map((entry) => (
              <Line
                key={entry.id}
                type="monotone"
                dataKey={entry.id}
                name={entry.name}
                stroke={entry.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 px-2">
        {progression.map((entry) => (
          <div key={entry.id} className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-f1-white/60">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
