"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DriverStats {
  wins: number;
  podiums: number;
  points: number;
  races: number;
  dnfs: number;
  avgQualPos: number | null;
  avgFinishPos: number | null;
}

interface H2HRadarChartProps {
  driver1Stats: DriverStats;
  driver2Stats: DriverStats;
  driver1Name: string;
  driver2Name: string;
  driver1Color?: string;
  driver2Color?: string;
}

function normalize(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min((value / max) * 100, 100);
}

export default function H2HRadarChart({
  driver1Stats,
  driver2Stats,
  driver1Name,
  driver2Name,
  driver1Color = "#E10600",
  driver2Color = "#00D2BE",
}: H2HRadarChartProps) {
  const maxWins = Math.max(driver1Stats.wins, driver2Stats.wins, 1);
  const maxPodiums = Math.max(driver1Stats.podiums, driver2Stats.podiums, 1);
  const maxPoints = Math.max(driver1Stats.points, driver2Stats.points, 1);

  // Consistency: (finishes / races) * 100
  const d1Finishes = driver1Stats.races - driver1Stats.dnfs;
  const d2Finishes = driver2Stats.races - driver2Stats.dnfs;
  const d1Consistency =
    driver1Stats.races > 0 ? (d1Finishes / driver1Stats.races) * 100 : 0;
  const d2Consistency =
    driver2Stats.races > 0 ? (d2Finishes / driver2Stats.races) * 100 : 0;

  // Qualifying: 100 - avgQualPos (higher is better, capped at 0)
  const d1Qualifying =
    driver1Stats.avgQualPos !== null
      ? Math.max(100 - driver1Stats.avgQualPos * 4, 0)
      : 0;
  const d2Qualifying =
    driver2Stats.avgQualPos !== null
      ? Math.max(100 - driver2Stats.avgQualPos * 4, 0)
      : 0;

  // Race Pace: 100 - avgFinishPos (higher is better, capped at 0)
  const d1RacePace =
    driver1Stats.avgFinishPos !== null
      ? Math.max(100 - driver1Stats.avgFinishPos * 4, 0)
      : 0;
  const d2RacePace =
    driver2Stats.avgFinishPos !== null
      ? Math.max(100 - driver2Stats.avgFinishPos * 4, 0)
      : 0;

  const data = [
    {
      stat: "Wins",
      driver1: normalize(driver1Stats.wins, maxWins),
      driver2: normalize(driver2Stats.wins, maxWins),
    },
    {
      stat: "Podiums",
      driver1: normalize(driver1Stats.podiums, maxPodiums),
      driver2: normalize(driver2Stats.podiums, maxPodiums),
    },
    {
      stat: "Points",
      driver1: normalize(driver1Stats.points, maxPoints),
      driver2: normalize(driver2Stats.points, maxPoints),
    },
    {
      stat: "Consistency",
      driver1: d1Consistency,
      driver2: d2Consistency,
    },
    {
      stat: "Qualifying",
      driver1: d1Qualifying,
      driver2: d2Qualifying,
    },
    {
      stat: "Race Pace",
      driver1: d1RacePace,
      driver2: d2RacePace,
    },
  ];

  return (
    <div className="card">
      <h3 className="font-heading text-sm font-semibold text-f1-white/60 uppercase tracking-wider mb-4">
        Performance Radar
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#2D2D2D" />
          <PolarAngleAxis
            dataKey="stat"
            tick={{ fill: "#F0F0F0", fontSize: 12, fontFamily: "var(--font-heading)" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name={driver1Name}
            dataKey="driver1"
            stroke={driver1Color}
            fill={driver1Color}
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Radar
            name={driver2Name}
            dataKey="driver2"
            stroke={driver2Color}
            fill={driver2Color}
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Legend
            wrapperStyle={{
              fontSize: 12,
              fontFamily: "var(--font-heading)",
              color: "#F0F0F0",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
