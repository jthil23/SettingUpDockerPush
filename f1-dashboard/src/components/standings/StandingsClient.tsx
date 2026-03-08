"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";
import ToggleTabs from "./ToggleTabs";
import StandingsTable from "./StandingsTable";
import type {
  DriverStandingRow,
  ConstructorStandingRow,
} from "./StandingsTable";
import PointsChart from "./PointsChart";

interface ProgressionEntry {
  id: string;
  name: string;
  color: string;
  data: { round: number; raceName: string; points: number }[];
}

interface StandingsClientProps {
  driverStandings: DriverStandingRow[];
  constructorStandings: ConstructorStandingRow[];
  driverProgression: ProgressionEntry[];
  constructorProgression: ProgressionEntry[];
  rounds: { round: number; raceName: string }[];
}

const tabs = ["Drivers", "Constructors"];

export default function StandingsClient({
  driverStandings,
  constructorStandings,
  driverProgression,
  constructorProgression,
  rounds,
}: StandingsClientProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <ToggleTabs
        options={tabs}
        activeIndex={activeTab}
        onChange={setActiveTab}
      />

      <AnimatePresence mode="wait">
        {activeTab === 0 ? (
          <motion.div
            key="drivers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Table */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={18} className="text-f1-red" />
                <h2 className="font-heading text-lg font-semibold text-f1-white">
                  Driver Standings
                </h2>
              </div>
              <StandingsTable type="drivers" standings={driverStandings} />
            </div>

            {/* Chart */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-f1-cyan" />
                <h2 className="font-heading text-lg font-semibold text-f1-white">
                  Points Progression
                </h2>
              </div>
              <PointsChart progression={driverProgression} rounds={rounds} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="constructors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Table */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={18} className="text-f1-red" />
                <h2 className="font-heading text-lg font-semibold text-f1-white">
                  Constructor Standings
                </h2>
              </div>
              <StandingsTable
                type="constructors"
                standings={constructorStandings}
              />
            </div>

            {/* Chart */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-f1-cyan" />
                <h2 className="font-heading text-lg font-semibold text-f1-white">
                  Points Progression
                </h2>
              </div>
              <PointsChart
                progression={constructorProgression}
                rounds={rounds}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
