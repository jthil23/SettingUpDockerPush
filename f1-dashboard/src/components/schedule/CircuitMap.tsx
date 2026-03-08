"use client";

import { useState } from "react";
import Image from "next/image";
import { CircuitInfo } from "@/lib/circuits";
import { Route, CornerDownRight, Gauge, Zap } from "lucide-react";

interface CircuitMapProps {
  circuitId: string;
  circuitInfo: CircuitInfo;
  compact?: boolean;
}

export default function CircuitMap({ circuitId, circuitInfo, compact = false }: CircuitMapProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Image src={circuitInfo.svgPath} alt={circuitId} width={80} height={48} className="opacity-40 invert" onError={() => setImgError(true)} />
        <div className="flex gap-3 text-[10px] text-f1-white/40">
          <span>{circuitInfo.length}</span>
          <span>{circuitInfo.turns} turns</span>
          <span>{circuitInfo.drsZones} DRS</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Image src={circuitInfo.svgPath} alt={circuitId} width={200} height={120} className="opacity-50 invert" onError={() => setImgError(true)} />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <div className="flex items-center gap-1.5 text-f1-white/60"><Route size={12} className="text-f1-red" /><span>{circuitInfo.length}</span></div>
          <div className="flex items-center gap-1.5 text-f1-white/60"><CornerDownRight size={12} className="text-f1-red" /><span>{circuitInfo.turns} turns</span></div>
          <div className="flex items-center gap-1.5 text-f1-white/60"><Zap size={12} className="text-f1-cyan" /><span>{circuitInfo.drsZones} DRS zones</span></div>
          <div className="flex items-center gap-1.5 text-f1-white/60"><Gauge size={12} className="text-purple-400" /><span>{circuitInfo.lapRecord}</span></div>
          <div className="col-span-2 text-[10px] text-f1-white/30">Record: {circuitInfo.lapRecordHolder} ({circuitInfo.lapRecordYear})</div>
        </div>
      </div>
    </div>
  );
}
