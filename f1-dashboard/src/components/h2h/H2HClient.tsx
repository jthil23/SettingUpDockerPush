"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompare } from "lucide-react";
import DriverSelector from "./DriverSelector";
import ComparisonStats from "./ComparisonStats";
import H2HRadarChart from "./H2HRadarChart";

interface Driver {
  driverId: string;
  firstName: string;
  lastName: string;
  code: string | null;
  teamColor: string | null;
  teamName: string | null;
}

interface DriverStats {
  driverId: string;
  name: string;
  code: string | null;
  teamColor: string | null;
  teamName: string | null;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  dnfs: number;
  races: number;
  bestFinish: number | null;
  avgQualPos: number | null;
  avgFinishPos: number | null;
}

interface H2HData {
  driver1: DriverStats;
  driver2: DriverStats;
}

interface H2HClientProps {
  drivers: Driver[];
  season: number;
}

export default function H2HClient({ drivers, season }: H2HClientProps) {
  const [driver1Id, setDriver1Id] = useState("");
  const [driver2Id, setDriver2Id] = useState("");
  const [data, setData] = useState<H2HData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async () => {
    if (!driver1Id || !driver2Id) {
      setData(null);
      return;
    }

    if (driver1Id === driver2Id) {
      setError("Please select two different drivers");
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/h2h?driver1=${driver1Id}&driver2=${driver2Id}&season=${season}`
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? "Failed to fetch comparison data");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [driver1Id, driver2Id, season]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  return (
    <div className="flex flex-col gap-6">
      {/* Driver selectors */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <DriverSelector
            drivers={drivers}
            selectedId={driver1Id}
            onChange={setDriver1Id}
            label="Driver 1"
          />

          <div className="flex items-center justify-center pb-1">
            <div className="w-10 h-10 rounded-full bg-f1-carbon flex items-center justify-center">
              <GitCompare size={18} className="text-f1-red" />
            </div>
          </div>

          <DriverSelector
            drivers={drivers}
            selectedId={driver2Id}
            onChange={setDriver2Id}
            label="Driver 2"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="card border-f1-red/30">
          <p className="text-f1-red text-sm text-center">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!driver1Id || !driver2Id ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <GitCompare size={48} className="text-f1-white/10 mb-4" />
          <p className="text-f1-white/40 text-lg mb-2">
            Select two drivers to compare
          </p>
          <p className="text-f1-white/25 text-sm">
            Choose drivers from the dropdowns above to see a head-to-head
            breakdown.
          </p>
        </div>
      ) : loading ? (
        /* Loading state */
        <div className="card flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-f1-red border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-f1-white/40 text-sm">Loading comparison...</p>
        </div>
      ) : data ? (
        /* Results */
        <AnimatePresence mode="wait">
          <motion.div
            key={`${driver1Id}-${driver2Id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* Comparison bars */}
            <ComparisonStats
              driver1Stats={data.driver1}
              driver2Stats={data.driver2}
            />

            {/* Radar chart */}
            <H2HRadarChart
              driver1Stats={data.driver1}
              driver2Stats={data.driver2}
              driver1Name={data.driver1.name}
              driver2Name={data.driver2.name}
              driver1Color={data.driver1.teamColor ?? "#E10600"}
              driver2Color={data.driver2.teamColor ?? "#00D2BE"}
            />
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  );
}
