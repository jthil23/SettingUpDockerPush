"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar } from "lucide-react";
import LiveIndicator from "./LiveIndicator";

interface HeroCountdownProps {
  raceName: string | null;
  circuitName: string | null;
  country: string | null;
  raceDate: string | null;
  raceTime: string | null;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function calcTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    totalMs: diff,
  };
}

function CountdownDigit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-1">
        {display.split("").map((digit, i) => (
          <span
            key={i}
            className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold text-f1-white bg-f1-carbon/60 border border-f1-gray/40 rounded-lg px-2.5 sm:px-3 md:px-4 py-2 sm:py-3 tabular-nums leading-none"
          >
            {digit}
          </span>
        ))}
      </div>
      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-f1-white/50 mt-2 font-medium">
        {label}
      </span>
    </div>
  );
}

function CountdownSeparator() {
  return (
    <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-f1-red/80 self-start mt-2 sm:mt-3">
      :
    </span>
  );
}

export default function HeroCountdown({
  raceName,
  circuitName,
  country,
  raceDate,
  raceTime,
}: HeroCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!raceDate) return;

    const target = raceTime
      ? new Date(`${raceDate}T${raceTime}`)
      : new Date(`${raceDate}T14:00:00Z`);

    setTimeLeft(calcTimeLeft(target));

    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(target));
    }, 1000);

    return () => clearInterval(interval);
  }, [raceDate, raceTime]);

  const formattedDate = raceDate
    ? new Date(raceDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // No upcoming race
  if (!raceName) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative card overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 70%, #1A1A1A 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at bottom right, rgba(225,6,0,0.3), transparent 60%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center py-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-f1-white/80 mb-2">
            Season Complete
          </h2>
          <p className="text-f1-white/40 text-sm">
            No upcoming races scheduled. Check back when the new season begins.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative card overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 70%, #1A1A1A 100%)",
      }}
    >
      {/* Faint red glow in corner */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at bottom right, rgba(225,6,0,0.4), transparent 60%)",
        }}
      />

      {/* Decorative racing stripe */}
      <div
        className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-10"
        style={{
          background:
            "linear-gradient(135deg, transparent 40%, rgba(225,6,0,0.6) 40%, rgba(225,6,0,0.6) 41%, transparent 41%)",
        }}
      />

      {/* Live Indicator */}
      <div className="absolute top-4 right-4 z-20">
        <LiveIndicator />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center py-6 sm:py-8 md:py-10">
        {/* Race Name */}
        <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-f1-white tracking-wide text-center mb-2">
          {raceName}
        </h1>

        {/* Circuit + Country */}
        <div className="flex items-center gap-3 text-f1-white/60 text-sm mb-6 sm:mb-8">
          {circuitName && (
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-f1-red" />
              {circuitName}
            </span>
          )}
          {country && (
            <span className="text-f1-white/30">|</span>
          )}
          {country && <span>{country}</span>}
        </div>

        {/* Countdown */}
        {mounted && timeLeft ? (
          timeLeft.totalMs > 0 ? (
            <div className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
              <CountdownDigit value={timeLeft.days} label="Days" />
              <CountdownSeparator />
              <CountdownDigit value={timeLeft.hours} label="Hours" />
              <CountdownSeparator />
              <CountdownDigit value={timeLeft.minutes} label="Mins" />
              <CountdownSeparator />
              <CountdownDigit value={timeLeft.seconds} label="Secs" />
            </div>
          ) : (
            <div className="mb-6 sm:mb-8">
              <span className="font-heading text-2xl font-bold text-f1-red uppercase tracking-wider animate-pulse-glow px-6 py-3 rounded-lg bg-f1-carbon/40 border border-f1-red/30">
                Race Underway
              </span>
            </div>
          )
        ) : (
          <div className="flex items-start gap-3 md:gap-4 mb-6 sm:mb-8 opacity-30">
            <CountdownDigit value={0} label="Days" />
            <CountdownSeparator />
            <CountdownDigit value={0} label="Hours" />
            <CountdownSeparator />
            <CountdownDigit value={0} label="Mins" />
            <CountdownSeparator />
            <CountdownDigit value={0} label="Secs" />
          </div>
        )}

        {/* Race Date */}
        {formattedDate && (
          <div className="flex items-center gap-2 text-f1-white/50 text-sm">
            <Calendar size={14} />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
