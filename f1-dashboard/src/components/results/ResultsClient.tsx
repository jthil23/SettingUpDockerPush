"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Flag, Timer, BarChart3 } from "lucide-react";
import RaceSelector from "./RaceSelector";
import ResultsTable from "./ResultsTable";
import QualifyingTable from "./QualifyingTable";

type Tab = "race" | "qualifying";

interface RaceOption {
  id: number;
  round: number;
  season: number;
  raceName: string;
  country: string;
}

interface ResultsClientProps {
  races: RaceOption[];
  defaultRaceId: number | null;
  defaultResults: Record<string, unknown>[];
  defaultQualifying: Record<string, unknown>[];
  availableSeasons: number[];
  selectedSeason: number;
}

export default function ResultsClient({
  races,
  defaultRaceId,
  defaultResults,
  defaultQualifying,
  availableSeasons,
  selectedSeason,
}: ResultsClientProps) {
  const router = useRouter();
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(defaultRaceId);
  const [activeTab, setActiveTab] = useState<Tab>("race");
  const [results, setResults] = useState(defaultResults);
  const [qualifying, setQualifying] = useState(defaultQualifying);
  const [loading, setLoading] = useState(false);

  const selectedRace = races.find((r) => r.id === selectedRaceId);

  const fetchResults = useCallback(
    async (raceId: number) => {
      const race = races.find((r) => r.id === raceId);
      if (!race) return;

      setLoading(true);
      try {
        const [raceRes, qualiRes] = await Promise.all([
          fetch(`/api/results/${race.season}/${race.round}`),
          fetch(`/api/qualifying/${race.season}/${race.round}`),
        ]);

        if (raceRes.ok) {
          const raceData = await raceRes.json();
          setResults(raceData);
        } else {
          setResults([]);
        }

        if (qualiRes.ok) {
          const qualiData = await qualiRes.json();
          setQualifying(qualiData);
        } else {
          setQualifying([]);
        }
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setResults([]);
        setQualifying([]);
      } finally {
        setLoading(false);
      }
    },
    [races]
  );

  const handleRaceChange = useCallback(
    (raceId: number) => {
      setSelectedRaceId(raceId);
      fetchResults(raceId);
    },
    [fetchResults]
  );

  if (races.length === 0 || selectedRaceId === null) {
    return (
      <div className="card flex flex-col items-center justify-center py-16">
        <Flag size={32} className="text-f1-white/20 mb-4" />
        <p className="text-f1-white/40 text-lg mb-2">No results available yet</p>
        <p className="text-f1-white/25 text-sm">
          Race results will appear here once races have been completed.
        </p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "race", label: "Race", icon: <Flag size={14} /> },
    { key: "qualifying", label: "Qualifying", icon: <Timer size={14} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={selectedSeason}
            onChange={(e) => router.push(`/results?season=${e.target.value}`)}
            className="bg-f1-dark border border-f1-carbon text-f1-white px-3 py-2.5 rounded-lg text-sm font-mono font-bold
              focus:outline-none focus:border-f1-red transition-colors duration-200
              appearance-none cursor-pointer
              bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23F0F0F0%22%20stroke-width%3D%222%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')]
              bg-[position:right_8px_center] bg-no-repeat pr-8"
          >
            {availableSeasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <RaceSelector
            races={races}
            selectedRaceId={selectedRaceId}
            onChange={handleRaceChange}
          />
        </div>

        <div className="flex items-center gap-1 bg-f1-dark border border-f1-carbon rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.key
                  ? "text-f1-white"
                  : "text-f1-white/40 hover:text-f1-white/70"
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="results-tab-bg"
                  className="absolute inset-0 bg-f1-carbon rounded-md"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Race info header */}
      {selectedRace && (
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-f1-red rounded-full" />
          <div>
            <h2 className="font-heading text-xl font-bold text-f1-white">
              {selectedRace.raceName}
            </h2>
            <p className="text-xs text-f1-white/40">
              Round {selectedRace.round} &middot; {selectedRace.season} Season
            </p>
          </div>
          <Link href={`/results/${selectedRace.season}/${selectedRace.round}`} className="flex items-center gap-1.5 text-xs text-f1-cyan hover:text-f1-cyan/80 transition-colors ml-auto">
            <BarChart3 size={14} />
            Full Race Analysis
          </Link>
        </div>
      )}

      {/* Content */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-f1-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "race" ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <ResultsTable results={results as any[]} />
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <QualifyingTable results={qualifying as any[]} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
