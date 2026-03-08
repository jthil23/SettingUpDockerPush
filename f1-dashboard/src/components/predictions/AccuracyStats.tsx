"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp, Target, Zap } from "lucide-react";

interface PredictionData {
  id: number;
  raceId: number;
  predictedWinner: string;
  predictedPodium: string[];
  predictedFastestLap: string | null;
  actualWinner: string | null;
  actualPodium: unknown;
  score: number | null;
  race: {
    id: number;
    round: number;
    raceName: string;
    date: string;
  };
}

interface AccuracyStatsProps {
  predictions: PredictionData[];
}

export default function AccuracyStats({ predictions }: AccuracyStatsProps) {
  const scored = predictions.filter((p) => p.score !== null);

  if (scored.length === 0) return null;

  const totalScore = scored.reduce((sum, p) => sum + (p.score ?? 0), 0);

  // Count correct individual predictions
  let correctPredictions = 0;
  let totalPredictionSlots = 0;

  for (const p of scored) {
    const actualPodium = (p.actualPodium as string[]) ?? [];
    totalPredictionSlots += 4; // winner, p2, p3, fastest lap

    if (p.predictedWinner === p.actualWinner) correctPredictions++;
    if (actualPodium[1] && p.predictedPodium.includes(actualPodium[1]))
      correctPredictions++;
    if (actualPodium[2] && p.predictedPodium.includes(actualPodium[2]))
      correctPredictions++;
    // Fastest lap counted as correct if it contributed score
    // Score breakdown: 25 winner, 10+10 podium, 5 fastest lap
    // If score includes fastest lap component, it's correct
    const winnerPts = p.predictedWinner === p.actualWinner ? 25 : 0;
    const p2Pts =
      actualPodium[1] && p.predictedPodium.includes(actualPodium[1]) ? 10 : 0;
    const p3Pts =
      actualPodium[2] && p.predictedPodium.includes(actualPodium[2]) ? 10 : 0;
    const flPts = (p.score ?? 0) - winnerPts - p2Pts - p3Pts;
    if (flPts > 0) correctPredictions++;
  }

  const accuracy =
    totalPredictionSlots > 0
      ? Math.round((correctPredictions / totalPredictionSlots) * 100)
      : 0;

  const bestPrediction = scored.reduce((best, p) =>
    (p.score ?? 0) > (best.score ?? 0) ? p : best
  );

  // Calculate winner streak (consecutive correct winner predictions, most recent first)
  let streak = 0;
  const sortedByRound = [...scored].sort(
    (a, b) => b.race.round - a.race.round
  );
  for (const p of sortedByRound) {
    if (p.predictedWinner === p.actualWinner) {
      streak++;
    } else {
      break;
    }
  }

  const stats = [
    {
      label: "Total Score",
      value: totalScore,
      icon: Trophy,
      color: "text-f1-yellow",
      bgColor: "bg-f1-yellow/10",
    },
    {
      label: "Accuracy",
      value: `${accuracy}%`,
      icon: Target,
      color: "text-f1-cyan",
      bgColor: "bg-f1-cyan/10",
    },
    {
      label: "Best Race",
      value: bestPrediction.score ?? 0,
      subtitle: bestPrediction.race.raceName,
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      label: "Winner Streak",
      value: streak,
      icon: Zap,
      color: "text-f1-red",
      bgColor: "bg-f1-red/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="card flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-f1-white/40 uppercase tracking-wider">
              {stat.label}
            </span>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon size={16} className={stat.color} />
            </div>
          </div>
          <div>
            <span className={`font-mono text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </span>
            {stat.subtitle && (
              <p className="text-xs text-f1-white/30 mt-1 truncate">
                {stat.subtitle}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
