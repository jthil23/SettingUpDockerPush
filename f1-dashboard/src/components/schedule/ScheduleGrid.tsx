"use client";

import { motion } from "framer-motion";
import RaceCard, { type RaceCardData } from "./RaceCard";

interface ScheduleGridProps {
  pastRaces: RaceCardData[];
  upcomingRaces: RaceCardData[];
}

export default function ScheduleGrid({ pastRaces, upcomingRaces }: ScheduleGridProps) {
  const nextRace = upcomingRaces.length > 0 ? upcomingRaces[0] : null;
  const futureRaces = upcomingRaces.slice(1);

  return (
    <div className="flex flex-col gap-6">
      {/* Past races */}
      {pastRaces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pastRaces.map((race) => (
            <RaceCard key={race.id} race={race} isPast isNext={false} />
          ))}
        </div>
      )}

      {/* NOW divider */}
      {(pastRaces.length > 0 || futureRaces.length > 0) && nextRace && (
        <div className="relative flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-f1-red/50 to-f1-red/50" />
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="shrink-0 text-xs font-heading font-bold uppercase tracking-[0.2em] text-f1-red bg-f1-black px-3 py-1 rounded-full border border-f1-red/30"
          >
            Up Next
          </motion.span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-f1-red/50 to-f1-red/50" />
        </div>
      )}

      {/* Next race (full width, prominent) */}
      {nextRace && (
        <div className="grid grid-cols-1">
          <RaceCard race={nextRace} isPast={false} isNext />
        </div>
      )}

      {/* Future races */}
      {futureRaces.length > 0 && (
        <>
          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-f1-carbon/60" />
            <span className="shrink-0 text-xs font-mono uppercase tracking-wider text-f1-white/25">
              Remaining Races
            </span>
            <div className="flex-1 h-px bg-f1-carbon/60" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {futureRaces.map((race) => (
              <RaceCard key={race.id} race={race} isPast={false} isNext={false} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
