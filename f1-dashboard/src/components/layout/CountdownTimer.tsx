"use client";

import { useState, useEffect } from "react";

interface NextRaceData {
  raceName: string;
  circuitName: string;
  country: string;
  date: string;
  time: string | null;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function calcTimeLeft(raceDate: Date): TimeLeft {
  const now = new Date();
  const diff = raceDate.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    totalMs: diff,
  };
}

function TimeSegment({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="font-mono text-sm font-bold text-f1-white tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-f1-white/50 uppercase">{label}</span>
    </div>
  );
}

export default function CountdownTimer() {
  const [race, setRace] = useState<NextRaceData | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchNextRace() {
      try {
        const res = await fetch("/api/next-race");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: NextRaceData = await res.json();
        setRace(data);
      } catch {
        setError(true);
      }
    }
    fetchNextRace();
  }, []);

  useEffect(() => {
    if (!race) return;

    const raceDateTime = race.time
      ? new Date(`${race.date}T${race.time}`)
      : new Date(`${race.date}T14:00:00Z`);

    setTimeLeft(calcTimeLeft(raceDateTime));

    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(raceDateTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [race]);

  if (error) return null;
  if (!race || !timeLeft) {
    return (
      <div className="flex items-center gap-2 text-f1-white/30 text-xs">
        Loading...
      </div>
    );
  }

  const withinDay = timeLeft.totalMs > 0 && timeLeft.totalMs <= 24 * 60 * 60 * 1000;
  const withinHour = timeLeft.totalMs > 0 && timeLeft.totalMs <= 60 * 60 * 1000;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-1.5 rounded-lg bg-f1-carbon/50 border border-f1-gray/30 ${
        withinDay ? "animate-pulse-glow" : ""
      }`}
      style={
        withinHour
          ? { animationDuration: "1s" }
          : withinDay
          ? { animationDuration: "2s" }
          : undefined
      }
    >
      <div className="flex flex-col">
        <span className="text-xs text-f1-white/70 leading-tight truncate max-w-[140px]">
          {race.raceName}
        </span>
        {withinHour && timeLeft.totalMs > 0 && (
          <span className="text-[10px] font-bold text-f1-red uppercase tracking-wider">
            Lights Out Soon
          </span>
        )}
      </div>

      {timeLeft.totalMs > 0 ? (
        <div className="flex items-center gap-1.5">
          <TimeSegment value={timeLeft.days} label="d" />
          <TimeSegment value={timeLeft.hours} label="h" />
          <TimeSegment value={timeLeft.minutes} label="m" />
          <TimeSegment value={timeLeft.seconds} label="s" />
        </div>
      ) : (
        <span className="text-xs font-bold text-f1-red uppercase">Race On</span>
      )}
    </div>
  );
}
