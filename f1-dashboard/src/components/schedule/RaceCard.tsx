"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Calendar, Flag, Trophy } from "lucide-react";
import { getCountryFlag } from "@/lib/country-flags";
import { getCircuitInfo } from "@/lib/circuits";
import CircuitMap from "./CircuitMap";
import SessionTimes from "./SessionTimes";

export interface RaceCardData {
  id: number;
  round: number;
  raceName: string;
  circuitId: string | null;
  date: string; // ISO date string
  time: string | null;
  fp1Date: string | null;
  fp1Time: string | null;
  fp2Date: string | null;
  fp2Time: string | null;
  fp3Date: string | null;
  fp3Time: string | null;
  qualiDate: string | null;
  qualiTime: string | null;
  sprintDate: string | null;
  sprintTime: string | null;
  circuit: {
    name: string;
    location: string;
    country: string;
  };
  winner: {
    firstName: string;
    lastName: string;
    constructorName: string;
  } | null;
}

interface RaceCardProps {
  race: RaceCardData;
  isPast: boolean;
  isNext: boolean;
}

function formatDateRange(dateStr: string, fp1DateStr: string | null): string {
  const raceDate = new Date(dateStr + "T00:00:00");
  const startDate = fp1DateStr
    ? new Date(fp1DateStr + "T00:00:00")
    : new Date(raceDate.getTime() - 2 * 86_400_000);

  const startFmt = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endFmt = raceDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${startFmt} - ${endFmt}`;
}

function MiniCountdown({ targetDate: dateStr, targetTime }: { targetDate: string; targetTime: string | null }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number } | null>(null);

  useEffect(() => {
    const target = targetTime
      ? new Date(`${dateStr}T${targetTime}`)
      : new Date(`${dateStr}T14:00:00Z`);

    function calc() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, mins: 0 };
      return {
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff / 3_600_000) % 24),
        mins: Math.floor((diff / 60_000) % 60),
      };
    }

    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 60_000);
    return () => clearInterval(interval);
  }, [dateStr, targetTime]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono">
      <span className="text-f1-red font-semibold">{timeLeft.days}d</span>
      <span className="text-f1-white/40">:</span>
      <span className="text-f1-red font-semibold">{timeLeft.hours}h</span>
      <span className="text-f1-white/40">:</span>
      <span className="text-f1-red font-semibold">{timeLeft.mins}m</span>
    </div>
  );
}

export default function RaceCard({ race, isPast, isNext }: RaceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const flag = getCountryFlag(race.circuit.country);
  const circuitInfo = getCircuitInfo(race.circuitId ?? "");
  const dateRange = formatDateRange(race.date, race.fp1Date);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`
        relative rounded-xl border p-5 cursor-pointer transition-all duration-300
        ${isNext
          ? "col-span-full bg-f1-dark border-f1-red/50 animate-pulse-glow scale-[1.01] shadow-lg"
          : isPast
            ? "bg-f1-dark/70 border-f1-carbon/60 opacity-75 hover:opacity-100"
            : "bg-f1-dark border-f1-carbon hover:border-f1-gray"
        }
      `}
      onClick={() => setExpanded((prev) => !prev)}
    >
      {/* Past race checkmark overlay */}
      {isPast && (
        <div className="absolute top-3 right-3 text-f1-white/15">
          <Flag size={32} />
        </div>
      )}

      {/* Header: Round badge + Race name */}
      <div className="flex items-start gap-3 mb-3">
        <span
          className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold font-mono ${
            isNext
              ? "bg-f1-red text-f1-white"
              : isPast
                ? "bg-f1-carbon/60 text-f1-white/50"
                : "bg-f1-carbon text-f1-white/70"
          }`}
        >
          R{race.round}
        </span>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-heading text-lg font-bold truncate ${
              isNext ? "text-f1-white" : isPast ? "text-f1-white/60" : "text-f1-white/90"
            }`}
          >
            {race.raceName}
          </h3>
        </div>
      </div>

      {/* Circuit info */}
      <div className="flex items-center gap-2 text-sm text-f1-white/50 mb-2">
        <MapPin size={13} className="shrink-0 text-f1-red/60" />
        <span className="truncate">
          {race.circuit.name}, {race.circuit.location}
        </span>
      </div>

      {/* Country + Date range */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-f1-white/50">
          {flag} {race.circuit.country}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-f1-white/40 font-mono">
          <Calendar size={12} />
          {dateRange}
        </span>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-between">
        {isPast && race.winner ? (
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-f1-yellow" />
            <span className="text-sm text-f1-white/70">
              <span className="font-semibold text-f1-white/90">
                {race.winner.firstName.charAt(0)}. {race.winner.lastName}
              </span>
              <span className="text-f1-white/40 ml-1.5">
                {race.winner.constructorName}
              </span>
            </span>
          </div>
        ) : isNext ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-f1-red opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-f1-red" />
            </span>
            <span className="text-xs text-f1-red font-semibold uppercase tracking-wider">
              Next Race
            </span>
            <MiniCountdown targetDate={race.date} targetTime={race.time} />
          </div>
        ) : (
          <span className="text-xs text-f1-white/30 uppercase tracking-wider">
            Upcoming
          </span>
        )}

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-f1-white/30"
        >
          <ChevronDown size={16} />
        </motion.div>
      </div>

      {/* Expandable session times + circuit map */}
      <AnimatePresence>
        {expanded && (
          <>
          {circuitInfo && <CircuitMap circuitId={race.circuitId ?? ""} circuitInfo={circuitInfo} compact />}
          <SessionTimes
            fp1Date={race.fp1Date}
            fp1Time={race.fp1Time}
            fp2Date={race.fp2Date}
            fp2Time={race.fp2Time}
            fp3Date={race.fp3Date}
            fp3Time={race.fp3Time}
            qualiDate={race.qualiDate}
            qualiTime={race.qualiTime}
            sprintDate={race.sprintDate}
            sprintTime={race.sprintTime}
            raceDate={race.date}
            raceTime={race.time}
          />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
