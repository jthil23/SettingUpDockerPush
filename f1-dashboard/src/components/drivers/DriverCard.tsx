"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { getCountryFlag } from "@/lib/country-flags";

interface DriverCardProps {
  driver: {
    driverId: string;
    firstName: string;
    lastName: string;
    number: number | null;
    nationality: string;
    position: number;
    points: number;
    constructorName: string;
    constructorColor: string | null;
  };
  index: number;
}

function positionBadgeColor(position: number): string {
  if (position === 1) return "bg-yellow-400 text-black";
  if (position === 2) return "bg-gray-300 text-black";
  if (position === 3) return "bg-amber-600 text-white";
  return "bg-f1-carbon text-f1-white/70";
}

export default function DriverCard({ driver, index }: DriverCardProps) {
  const teamColor = driver.constructorColor || "#3D3D3D";
  const flag = getCountryFlag(driver.nationality);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        href={`/drivers/${driver.driverId}`}
        className="group block relative overflow-hidden rounded-xl bg-f1-dark border border-f1-carbon transition-all duration-300 hover:scale-[1.02]"
        style={{
          boxShadow: "0 0 0 rgba(0,0,0,0)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 0 20px ${teamColor}40, 0 0 40px ${teamColor}20`;
          e.currentTarget.style.borderColor = `${teamColor}80`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
          e.currentTarget.style.borderColor = "";
        }}
      >
        {/* Team color gradient top edge */}
        <div
          className="h-[3px] w-full"
          style={{
            background: `linear-gradient(90deg, ${teamColor}, ${teamColor}80)`,
          }}
        />

        <div className="relative p-4">
          {/* Position badge - top corner */}
          <div
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold ${positionBadgeColor(driver.position)}`}
          >
            P{driver.position}
          </div>

          {/* Driver number as background element */}
          <div
            className="absolute top-2 left-3 font-heading text-6xl font-bold leading-none select-none pointer-events-none"
            style={{ color: `${teamColor}15` }}
          >
            {driver.number ?? ""}
          </div>

          {/* Driver info */}
          <div className="relative z-10 pt-6 pb-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-lg">{flag}</span>
              <span className="text-xs text-f1-white/40">
                {driver.nationality}
              </span>
            </div>

            <h3 className="font-heading text-lg leading-tight">
              <span className="text-f1-white/70">{driver.firstName}</span>{" "}
              <span className="font-bold uppercase text-f1-white">
                {driver.lastName}
              </span>
            </h3>

            <p className="text-xs text-f1-white/40 mt-1">
              {driver.constructorName}
            </p>
          </div>

          {/* Points badge - bottom corner */}
          <div className="flex items-end justify-between mt-2">
            <div
              className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${teamColor}20`,
                color: teamColor,
              }}
            >
              #{driver.number ?? "--"}
            </div>
            <div className="text-right">
              <span className="font-mono text-xl font-bold text-f1-white tabular-nums">
                {driver.points}
              </span>
              <span className="text-xs text-f1-white/30 ml-1">PTS</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
