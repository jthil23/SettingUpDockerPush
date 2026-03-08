"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp, Medal, Flag } from "lucide-react";

interface TeamStatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  delay: number;
  color: string;
}

function TeamStatCard({ icon, value, label, delay, color }: TeamStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="card flex flex-col items-center justify-center gap-2 py-6"
      style={{
        borderColor: `${color}30`,
      }}
    >
      <div style={{ color }}>{icon}</div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.2 }}
        className="font-mono text-3xl font-bold text-f1-white tabular-nums"
      >
        {value}
      </motion.span>
      <span className="text-xs text-f1-white/40 uppercase tracking-wider font-heading">
        {label}
      </span>
    </motion.div>
  );
}

interface TeamProfileProps {
  stats: {
    points: number;
    wins: number;
    podiums: number;
    races: number;
  };
  color: string;
}

export default function TeamProfile({ stats, color }: TeamProfileProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <TeamStatCard
        icon={<Flag size={22} />}
        value={stats.races}
        label="Races"
        delay={0}
        color={color}
      />
      <TeamStatCard
        icon={<Trophy size={22} />}
        value={stats.wins}
        label="Wins"
        delay={0.1}
        color={color}
      />
      <TeamStatCard
        icon={<Medal size={22} />}
        value={stats.podiums}
        label="Podiums"
        delay={0.2}
        color={color}
      />
      <TeamStatCard
        icon={<TrendingUp size={22} />}
        value={stats.points}
        label="Points"
        delay={0.3}
        color={color}
      />
    </div>
  );
}
