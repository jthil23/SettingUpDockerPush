"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Check, Loader2 } from "lucide-react";

interface Driver {
  driverId: string;
  firstName: string;
  lastName: string;
  code: string | null;
}

interface Race {
  id: number;
  round: number;
  raceName: string;
  date: string;
  time: string | null;
}

interface PredictionFormProps {
  race: Race;
  drivers: Driver[];
  onSubmit: () => void;
}

export default function PredictionForm({
  race,
  drivers,
  onSubmit,
}: PredictionFormProps) {
  const [predictedWinner, setPredictedWinner] = useState("");
  const [predictedP2, setPredictedP2] = useState("");
  const [predictedP3, setPredictedP3] = useState("");
  const [predictedFastestLap, setPredictedFastestLap] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const raceDate = new Date(race.date);
  const formattedDate = raceDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!predictedWinner || !predictedP2 || !predictedP3) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raceId: race.id,
          predictedWinner,
          predictedPodium: [predictedP2, predictedP3],
          predictedFastestLap: predictedFastestLap || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit prediction");
      }

      setSuccess(true);
      setTimeout(() => {
        onSubmit();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const renderSelect = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    excludeIds: string[] = []
  ) => {
    const availableDrivers = drivers.filter(
      (d) => !excludeIds.includes(d.driverId) || d.driverId === value
    );

    return (
      <div className="flex flex-col gap-2">
        <label className="text-xs text-f1-white/40 uppercase tracking-wider font-medium">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-f1-dark border border-f1-carbon rounded-lg px-4 py-3 text-f1-white text-sm
                     focus:outline-none focus:border-f1-red transition-colors duration-200
                     appearance-none cursor-pointer"
          required
        >
          <option value="" className="bg-f1-dark text-f1-white/40">
            Select a driver...
          </option>
          {availableDrivers.map((d) => (
            <option
              key={d.driverId}
              value={d.driverId}
              className="bg-f1-dark text-f1-white"
            >
              {d.firstName} {d.lastName}
              {d.code ? ` (${d.code})` : ""}
            </option>
          ))}
        </select>
      </div>
    );
  };

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card flex flex-col items-center justify-center py-12 gap-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
        >
          <Check size={32} className="text-green-400" />
        </motion.div>
        <p className="font-heading text-xl font-bold text-f1-white">
          Prediction Submitted!
        </p>
        <p className="text-sm text-f1-white/40">
          Good luck for the {race.raceName}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-f1-red/10">
          <Target size={20} className="text-f1-red" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-f1-white">
            {race.raceName}
          </h2>
          <p className="text-xs text-f1-white/40">
            Round {race.round} &middot; {formattedDate}
          </p>
        </div>
      </div>

      <div className="accent-line mb-6" />

      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {renderSelect("Predicted Winner (P1)", predictedWinner, setPredictedWinner)}
        {renderSelect("Predicted P2", predictedP2, setPredictedP2, [
          predictedWinner,
        ])}
        {renderSelect("Predicted P3", predictedP3, setPredictedP3, [
          predictedWinner,
          predictedP2,
        ])}
        {renderSelect(
          "Predicted Fastest Lap",
          predictedFastestLap,
          setPredictedFastestLap
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-2"
        >
          {error}
        </motion.p>
      )}

      {/* Submit */}
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={
            submitting || !predictedWinner || !predictedP2 || !predictedP3
          }
          className="flex items-center gap-2 px-6 py-3 bg-f1-red text-white font-heading font-bold
                     rounded-lg transition-all duration-200 hover:bg-f1-red/80
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-f1-red"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Target size={16} />
          )}
          {submitting ? "Submitting..." : "Lock In Prediction"}
        </button>
      </div>
    </motion.form>
  );
}
