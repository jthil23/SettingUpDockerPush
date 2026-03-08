"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface SessionTimesProps {
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
  raceDate: string;
  raceTime: string | null;
}

interface Session {
  name: string;
  date: string | null;
  time: string | null;
}

function formatSessionDateTime(
  date: string | null,
  time: string | null
): { dateStr: string; timeStr: string } | null {
  if (!date) return null;

  const dateObj = new Date(date + "T00:00:00");
  const dateStr = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (!time) {
    return { dateStr, timeStr: "TBC" };
  }

  // Parse the time (format: "HH:MM:SSZ" or "HH:MM:SS")
  const fullDateTime = new Date(`${date}T${time}`);
  const timeStr = fullDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return { dateStr, timeStr };
}

export default function SessionTimes({
  fp1Date,
  fp1Time,
  fp2Date,
  fp2Time,
  fp3Date,
  fp3Time,
  qualiDate,
  qualiTime,
  sprintDate,
  sprintTime,
  raceDate,
  raceTime,
}: SessionTimesProps) {
  const sessions: Session[] = [
    { name: "FP1", date: fp1Date, time: fp1Time },
    { name: "FP2", date: fp2Date, time: fp2Time },
    { name: "FP3", date: fp3Date, time: fp3Time },
    { name: "Qualifying", date: qualiDate, time: qualiTime },
    ...(sprintDate
      ? [{ name: "Sprint", date: sprintDate, time: sprintTime }]
      : []),
    { name: "Race", date: raceDate, time: raceTime },
  ];

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="pt-4 mt-4 border-t border-f1-carbon">
        <div className="flex items-center gap-2 text-f1-white/50 text-xs uppercase tracking-wider mb-3">
          <Clock size={12} />
          <span>Session Schedule (Local Time)</span>
        </div>
        <div className="space-y-2">
          {sessions.map((session) => {
            const formatted = formatSessionDateTime(session.date, session.time);
            if (!formatted) return null;

            const isRace = session.name === "Race";

            return (
              <div
                key={session.name}
                className={`flex items-center justify-between py-1.5 px-2 rounded ${
                  isRace
                    ? "bg-f1-red/10 border border-f1-red/20"
                    : "bg-f1-carbon/20"
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    isRace ? "text-f1-red" : "text-f1-white/70"
                  }`}
                >
                  {session.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-f1-white/40 font-mono">
                    {formatted.dateStr}
                  </span>
                  <span
                    className={`text-sm font-mono ${
                      isRace ? "text-f1-white font-semibold" : "text-f1-white/60"
                    }`}
                  >
                    {formatted.timeStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
