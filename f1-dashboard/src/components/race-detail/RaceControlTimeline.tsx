"use client";
import { AlertTriangle, Flag, Shield, Zap, CircleAlert } from "lucide-react";

interface RaceControlEvent { date: string; category: string; flag?: string; message: string; driverNumber?: number; lapNumber?: number; scope?: string; }
interface RaceControlTimelineProps { events: RaceControlEvent[]; }

function getCategoryIcon(category: string, flag?: string) {
  if (flag === "RED") return <Flag size={14} className="text-red-500" />;
  if (flag === "YELLOW" || flag === "DOUBLE YELLOW") return <AlertTriangle size={14} className="text-yellow-400" />;
  if (flag === "GREEN") return <Flag size={14} className="text-green-400" />;
  if (flag === "CHEQUERED") return <Flag size={14} className="text-f1-white" />;
  if (category === "SafetyCar") return <Shield size={14} className="text-orange-400" />;
  if (category === "Drs") return <Zap size={14} className="text-green-400" />;
  return <CircleAlert size={14} className="text-f1-white/40" />;
}

function getCategoryColor(category: string, flag?: string): string {
  if (flag === "RED") return "border-red-500/50";
  if (flag === "YELLOW" || flag === "DOUBLE YELLOW") return "border-yellow-400/50";
  if (flag === "GREEN") return "border-green-400/50";
  if (category === "SafetyCar") return "border-orange-400/50";
  if (category === "Drs") return "border-green-400/30";
  return "border-f1-gray/30";
}

export default function RaceControlTimeline({ events }: RaceControlTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No race control data available</p>
      </div>
    );
  }
  return (
    <div className="card p-4 overflow-hidden">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">Race Control</h3>
      <div className="flex flex-col gap-0 max-h-[400px] overflow-y-auto">
        {events.map((event, i) => (
          <div key={i} className={`flex items-start gap-3 py-2.5 px-3 border-l-2 ${getCategoryColor(event.category, event.flag)} ${i < events.length - 1 ? "border-b border-b-f1-gray/10" : ""}`}>
            <div className="shrink-0 mt-0.5">{getCategoryIcon(event.category, event.flag)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-f1-white/80">{event.message}</p>
              <div className="flex items-center gap-2 mt-1">
                {event.lapNumber && <span className="text-[10px] text-f1-white/40 font-mono">Lap {event.lapNumber}</span>}
                {event.scope && <span className="text-[10px] text-f1-white/30">{event.scope}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
