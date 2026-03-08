"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import AccuracyStats from "./AccuracyStats";
import PredictionForm from "./PredictionForm";
import PredictionResults from "./PredictionResults";

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

interface Race {
  id: number;
  round: number;
  raceName: string;
  date: string;
  time: string | null;
  results: RaceResult[];
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
  createdAt: string;
  race: {
    id: number;
    round: number;
    raceName: string;
    date: string;
  };
}

interface PredictionsClientProps {
  races: Race[];
  predictions: PredictionData[];
  drivers: Driver[];
  fastestLapMap: Record<
    number,
    { driverId: string; firstName: string; lastName: string; code: string | null }
  >;
}

export default function PredictionsClient({
  races,
  predictions: initialPredictions,
  drivers,
  fastestLapMap,
}: PredictionsClientProps) {
  const [predictions, setPredictions] = useState(initialPredictions);

  const now = new Date();

  // Find the next race without a prediction
  const predictedRaceIds = new Set(predictions.map((p) => p.raceId));
  const nextUnpredictedRace = races.find(
    (r) => new Date(r.date) > now && !predictedRaceIds.has(r.id)
  );

  // Build race results map for PredictionResults
  const raceResults: Record<number, RaceResult[]> = {};
  for (const race of races) {
    if (race.results.length > 0) {
      raceResults[race.id] = race.results;
    }
  }

  const handlePredictionSubmit = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions");
      if (res.ok) {
        const data = await res.json();
        setPredictions(
          data.map((p: { createdAt: string; race: { date: string } }) => ({
            ...p,
            createdAt:
              typeof p.createdAt === "string"
                ? p.createdAt
                : new Date(p.createdAt).toISOString(),
            race: {
              ...p.race,
              date:
                typeof p.race.date === "string"
                  ? p.race.date
                  : new Date(p.race.date).toISOString(),
            },
          }))
        );
      }
    } catch (err) {
      console.error("Failed to refresh predictions:", err);
    }
  }, []);

  if (races.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16">
        <Target size={32} className="text-f1-white/20 mb-4" />
        <p className="text-f1-white/40 text-lg mb-2">No races scheduled</p>
        <p className="text-f1-white/25 text-sm">
          Race data will appear here once the season schedule has been synced.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Accuracy stats */}
      <AccuracyStats predictions={predictions} />

      {/* Prediction form for next race */}
      {nextUnpredictedRace && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PredictionForm
            race={nextUnpredictedRace}
            drivers={drivers}
            onSubmit={handlePredictionSubmit}
          />
        </motion.div>
      )}

      {/* No upcoming races message */}
      {!nextUnpredictedRace && predictions.length > 0 && (
        <div className="card flex flex-col items-center justify-center py-8">
          <Target size={24} className="text-f1-cyan mb-3" />
          <p className="text-f1-white/50 text-sm">
            All upcoming races have predictions locked in!
          </p>
        </div>
      )}

      {/* No predictions yet message */}
      {predictions.length === 0 && !nextUnpredictedRace && (
        <div className="card flex flex-col items-center justify-center py-16">
          <Target size={32} className="text-f1-white/20 mb-4" />
          <p className="text-f1-white/40 text-lg mb-2">
            No predictions yet
          </p>
          <p className="text-f1-white/25 text-sm">
            Predictions can be made for upcoming races before they start.
          </p>
        </div>
      )}

      {/* Past prediction results */}
      <PredictionResults
        predictions={predictions}
        drivers={drivers}
        raceResults={raceResults}
        fastestLapMap={fastestLapMap}
      />
    </div>
  );
}
