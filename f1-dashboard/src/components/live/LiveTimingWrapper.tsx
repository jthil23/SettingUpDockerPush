"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";
import LiveTiming from "./LiveTiming";

interface LiveStatus {
  isLive: boolean;
  sessionName: string | null;
}

export default function LiveTimingWrapper() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/live/status");
        if (!res.ok) return;
        const data: LiveStatus = await res.json();
        setStatus(data);
      } catch {
        // Silently fail
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Don't render anything if no live session
  if (!status?.isLive) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-f1-carbon/60 border border-green-500/30 hover:border-green-500/50 transition-all group cursor-pointer w-full"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
        <Radio
          size={16}
          className="text-green-400 group-hover:text-green-300 transition-colors"
        />
        <span className="font-heading text-sm font-bold text-f1-white uppercase tracking-wider">
          {expanded ? "Hide Live Timing" : "View Live Timing"}
        </span>
        {status.sessionName && (
          <span className="text-xs text-f1-white/50 ml-auto">
            {status.sessionName}
          </span>
        )}
      </button>

      {/* Expandable LiveTiming panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <LiveTiming />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
