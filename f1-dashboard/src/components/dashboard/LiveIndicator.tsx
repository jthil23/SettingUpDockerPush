"use client";

import { useState, useEffect } from "react";

interface LiveStatus {
  isLive: boolean;
  sessionName: string | null;
}

export default function LiveIndicator() {
  const [status, setStatus] = useState<LiveStatus | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/live/status");
        if (!res.ok) return;
        const data: LiveStatus = await res.json();
        setStatus(data);
      } catch {
        // Silently fail — indicator simply stays hidden
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!status?.isLive) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-f1-carbon/80 border border-f1-gray/30 backdrop-blur-sm">
      {/* Pulsing green dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
      </span>
      <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
        Live
      </span>
      {status.sessionName && (
        <span className="text-xs text-f1-white/60">{status.sessionName}</span>
      )}
    </div>
  );
}
