"use client";

import { motion } from "framer-motion";
import { Check, X, Trophy } from "lucide-react";

interface Driver {
  driverId: string;
  firstName: string;
  lastName: string;
  code: string | null;
}

interface RaceResult {
  position: number | null;
  driverId: string;
  driver: Driver;
}

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

interface PredictionResultsProps {
  predictions: PredictionData[];
  drivers: Driver[];
  raceResults: Record<number, RaceResult[]>;
  fastestLapMap: Record<number, Driver>;
}

function getDriverName(driverId: string, drivers: Driver[]): string {
  const driver = drivers.find((d) => d.driverId === driverId);
  if (!driver) return driverId;
  return driver.code || `${driver.firstName[0]}. ${driver.lastName}`;
}

function getDriverFullName(driverId: string, drivers: Driver[]): string {
  const driver = drivers.find((d) => d.driverId === driverId);
  if (!driver) return driverId;
  return `${driver.firstName} ${driver.lastName}`;
}

interface ComparisonRowProps {
  label: string;
  predicted: string;
  actual: string;
  isCorrect: boolean;
  drivers: Driver[];
  points: number;
}

function ComparisonRow({
  label,
  predicted,
  actual,
  isCorrect,
  drivers,
  points,
}: ComparisonRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-20 text-xs text-f1-white/30 uppercase tracking-wider shrink-0">
        {label}
      </div>
      <div className="flex-1 flex items-center gap-2">
        <span className="text-sm text-f1-white/70" title={getDriverFullName(predicted, drivers)}>
          {getDriverName(predicted, drivers)}
        </span>
      </div>
      <div className="text-f1-white/20 text-xs">vs</div>
      <div className="flex-1 flex items-center gap-2 justify-end">
        <span className="text-sm text-f1-white/70" title={getDriverFullName(actual, drivers)}>
          {actual ? getDriverName(actual, drivers) : "---"}
        </span>
      </div>
      <div className="w-14 flex items-center justify-end gap-1.5 shrink-0">
        {isCorrect ? (
          <>
            <span className="font-mono text-xs text-green-400">+{points}</span>
            <Check size={14} className="text-green-400" />
          </>
        ) : (
          <X size={14} className="text-red-400/60" />
        )}
      </div>
    </div>
  );
}

export default function PredictionResults({
  predictions,
  drivers,
  raceResults,
  fastestLapMap,
}: PredictionResultsProps) {
  const scoredPredictions = predictions.filter((p) => p.score !== null);

  if (scoredPredictions.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-bold text-f1-white flex items-center gap-2">
        <Trophy size={18} className="text-f1-yellow" />
        Past Predictions
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {scoredPredictions.map((prediction, i) => {
          const actualPodium = (prediction.actualPodium as string[]) ?? [];
          const results = raceResults[prediction.raceId] ?? [];
          const actualP1 = results.find((r) => r.position === 1);
          const actualP2 = results.find((r) => r.position === 2);
          const actualP3 = results.find((r) => r.position === 3);
          const actualFL = fastestLapMap[prediction.raceId];

          const winnerCorrect =
            prediction.predictedWinner === actualP1?.driverId;
          const p2Correct =
            actualP2 &&
            prediction.predictedPodium.includes(actualP2.driverId);
          const p3Correct =
            actualP3 &&
            prediction.predictedPodium.includes(actualP3.driverId);
          const flCorrect =
            prediction.predictedFastestLap &&
            actualFL &&
            prediction.predictedFastestLap === actualFL.driverId;

          return (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card"
            >
              {/* Race header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading text-sm font-bold text-f1-white">
                    {prediction.race.raceName}
                  </h3>
                  <p className="text-xs text-f1-white/30">
                    Round {prediction.race.round}
                  </p>
                </div>
                <div
                  className={`font-mono text-lg font-bold px-3 py-1 rounded-lg ${
                    (prediction.score ?? 0) >= 25
                      ? "text-green-400 bg-green-400/10"
                      : (prediction.score ?? 0) > 0
                        ? "text-f1-yellow bg-f1-yellow/10"
                        : "text-f1-white/30 bg-f1-white/5"
                  }`}
                >
                  {prediction.score ?? 0}
                  <span className="text-xs ml-0.5 opacity-50">pts</span>
                </div>
              </div>

              {/* Column headers */}
              <div className="flex items-center gap-3 pb-2 border-b border-f1-carbon/50 mb-1">
                <div className="w-20 shrink-0" />
                <div className="flex-1 text-[10px] text-f1-white/20 uppercase tracking-wider">
                  Predicted
                </div>
                <div className="w-6" />
                <div className="flex-1 text-[10px] text-f1-white/20 uppercase tracking-wider text-right">
                  Actual
                </div>
                <div className="w-14 shrink-0" />
              </div>

              {/* Comparisons */}
              <ComparisonRow
                label="Winner"
                predicted={prediction.predictedWinner}
                actual={actualP1?.driverId ?? ""}
                isCorrect={winnerCorrect}
                drivers={drivers}
                points={25}
              />
              <ComparisonRow
                label="P2"
                predicted={prediction.predictedPodium[0] ?? ""}
                actual={actualP2?.driverId ?? ""}
                isCorrect={!!p2Correct}
                drivers={drivers}
                points={10}
              />
              <ComparisonRow
                label="P3"
                predicted={prediction.predictedPodium[1] ?? ""}
                actual={actualP3?.driverId ?? ""}
                isCorrect={!!p3Correct}
                drivers={drivers}
                points={10}
              />
              {prediction.predictedFastestLap && (
                <ComparisonRow
                  label="FL"
                  predicted={prediction.predictedFastestLap}
                  actual={actualFL?.driverId ?? ""}
                  isCorrect={!!flCorrect}
                  drivers={drivers}
                  points={5}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
