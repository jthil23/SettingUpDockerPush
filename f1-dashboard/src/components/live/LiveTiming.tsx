"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { Radio, Activity, Timer } from "lucide-react";

interface DriverPosition {
  position: number;
  driverNumber: number;
  abbreviation: string;
  fullName: string;
  teamName: string;
  teamColour: string | null;
  gapToLeader: number | null;
  interval: number | null;
}

interface RaceControlMessage {
  date: string;
  category: string;
  flag?: string;
  message: string;
  driverNumber?: number;
  lapNumber?: number;
  scope?: string;
}

interface WeatherInfo {
  airTemp: number;
  trackTemp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainfall: number;
}

interface LiveData {
  active: boolean;
  sessionName?: string;
  meetingName?: string;
  positions?: DriverPosition[];
  raceControl?: RaceControlMessage[];
  weather?: WeatherInfo | null;
  heartbeat?: boolean;
  reason?: string;
  error?: string;
}

function formatInterval(value: number | null): string {
  if (value === null || value === undefined) return "---";
  if (value === 0) return "LEADER";
  return `+${value.toFixed(3)}`;
}

function getIntervalColor(value: number | null, isLeader: boolean): string {
  if (isLeader) return "text-f1-white";
  if (value === null) return "text-f1-white/50";
  if (value < 0.5) return "text-green-400";
  if (value < 2.0) return "text-f1-yellow";
  return "text-f1-white/70";
}

export default function LiveTiming() {
  const [data, setData] = useState<LiveData | null>(null);
  const [connected, setConnected] = useState(false);
  const [previousPositions, setPreviousPositions] = useState<
    Map<number, number>
  >(new Map());
  const [raceControlMessages, setRaceControlMessages] = useState<RaceControlMessage[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/live");
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const parsed: LiveData = JSON.parse(event.data);

        if (!parsed.active) {
          setData({ active: false });
          es.close();
          setConnected(false);
          return;
        }

        if (parsed.heartbeat) return;

        if (parsed.raceControl && parsed.raceControl.length > 0) {
          setRaceControlMessages((prev) => [...prev, ...parsed.raceControl!].slice(-20));
        }

        // Track position changes
        if (parsed.positions) {
          setData((prev) => {
            if (prev?.positions) {
              const prevMap = new Map(
                prev.positions.map((p) => [p.driverNumber, p.position])
              );
              setPreviousPositions(prevMap);
            }
            return parsed;
          });
        }
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      es.close();
      setConnected(false);

      // Auto-reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // No active session
  if (data && !data.active) {
    return (
      <div className="card p-6">
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Radio size={32} className="text-f1-white/30" />
          <h3 className="font-heading text-xl font-bold text-f1-white/50 uppercase tracking-wider">
            No Live Session
          </h3>
          <p className="text-sm text-f1-white/30">
            Live timing will appear here when a session is active.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!data || !data.positions) {
    return (
      <div className="card p-6">
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Activity size={24} className="text-f1-cyan animate-pulse" />
          <p className="text-sm text-f1-white/50">
            Connecting to live timing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-f1-gray/30 bg-f1-carbon/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
              Live
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-sm font-bold text-f1-white">
              {data.meetingName}
            </span>
            <span className="text-xs text-f1-white/50">
              {data.sessionName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-f1-white/40">
          <Timer size={14} />
          <span className="text-xs">
            {connected ? "Connected" : "Reconnecting..."}
          </span>
        </div>
      </div>

      {/* Weather strip */}
      {data.weather && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-f1-gray/20 bg-f1-carbon/20 text-[11px] text-f1-white/50">
          <span>Air {data.weather.airTemp}°C</span>
          <span>Track {data.weather.trackTemp}°C</span>
          <span>Humidity {data.weather.humidity}%</span>
          <span>Wind {data.weather.windSpeed} km/h</span>
          {data.weather.rainfall > 0 && (
            <span className="text-blue-400 font-semibold">RAIN</span>
          )}
        </div>
      )}

      {/* Table header */}
      <div className="grid grid-cols-[3rem_1fr_6rem_6rem] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-f1-white/40 font-medium border-b border-f1-gray/20">
        <span>Pos</span>
        <span>Driver</span>
        <span className="text-right">Interval</span>
        <span className="text-right">Gap</span>
      </div>

      {/* Positions */}
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {data.positions.map((driver) => {
            const prevPosition = previousPositions.get(driver.driverNumber);
            const positionChanged =
              prevPosition !== undefined && prevPosition !== driver.position;
            const gained =
              prevPosition !== undefined && driver.position < prevPosition;

            return (
              <motion.div
                key={driver.driverNumber}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  backgroundColor: positionChanged
                    ? gained
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(239, 68, 68, 0.1)"
                    : "transparent",
                }}
                transition={{
                  layout: { duration: 0.4, ease: "easeInOut" },
                  backgroundColor: { duration: 1.5 },
                }}
                className="grid grid-cols-[3rem_1fr_6rem_6rem] gap-2 px-4 py-2.5 border-b border-f1-gray/10 items-center hover:bg-f1-carbon/30 transition-colors"
              >
                {/* Position */}
                <span className="font-mono text-sm font-bold text-f1-white tabular-nums">
                  {driver.position}
                </span>

                {/* Driver info */}
                <div className="flex items-center gap-2 min-w-0">
                  {/* Team color bar */}
                  <div
                    className="w-1 h-6 rounded-full shrink-0"
                    style={{
                      backgroundColor: driver.teamColour
                        ? `#${driver.teamColour}`
                        : "#666",
                    }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-f1-white truncate">
                      {driver.abbreviation}
                    </span>
                    <span className="text-[10px] text-f1-white/40 truncate">
                      {driver.teamName}
                    </span>
                  </div>
                </div>

                {/* Interval to car ahead */}
                <span
                  className={`text-right font-mono text-xs tabular-nums ${getIntervalColor(
                    driver.interval,
                    driver.position === 1
                  )}`}
                >
                  {driver.position === 1
                    ? "---"
                    : formatInterval(driver.interval)}
                </span>

                {/* Gap to leader */}
                <span
                  className={`text-right font-mono text-xs tabular-nums ${
                    driver.position === 1
                      ? "text-f1-white"
                      : "text-f1-white/60"
                  }`}
                >
                  {driver.position === 1
                    ? "LEADER"
                    : formatInterval(driver.gapToLeader)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </LayoutGroup>

      {/* Race Control Feed */}
      {raceControlMessages.length > 0 && (
        <div className="border-t border-f1-gray/30 max-h-32 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-f1-white/40 font-medium sticky top-0 bg-f1-dark">
            Race Control
          </div>
          {raceControlMessages.slice().reverse().map((msg, i) => (
            <div key={i} className="flex items-start gap-2 px-4 py-1.5 text-xs border-b border-f1-gray/10">
              <span className={`shrink-0 w-2 h-2 rounded-full mt-1 ${
                msg.flag === "RED" ? "bg-red-500" :
                msg.flag === "YELLOW" || msg.flag === "DOUBLE YELLOW" ? "bg-yellow-400" :
                msg.category === "SafetyCar" ? "bg-orange-400" :
                msg.category === "Drs" ? "bg-green-400" :
                "bg-f1-white/30"
              }`} />
              <span className="text-f1-white/70 flex-1">{msg.message}</span>
              {msg.lapNumber && (
                <span className="text-f1-white/30 font-mono shrink-0">L{msg.lapNumber}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
