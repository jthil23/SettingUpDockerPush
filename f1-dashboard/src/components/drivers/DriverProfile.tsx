"use client";

import { motion } from "framer-motion";
import { Trophy, Flag, TrendingUp, Medal, AlertTriangle } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  delay: number;
}

function StatCard({ icon, value, label, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="card flex flex-col items-center justify-center gap-2 py-6"
    >
      <div className="text-f1-red">{icon}</div>
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

interface DriverProfileProps {
  stats: {
    races: number;
    wins: number;
    podiums: number;
    points: number;
    dnfs: number;
  };
}

export default function DriverProfile({ stats }: DriverProfileProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard
        icon={<Flag size={22} />}
        value={stats.races}
        label="Races"
        delay={0}
      />
      <StatCard
        icon={<Trophy size={22} />}
        value={stats.wins}
        label="Wins"
        delay={0.1}
      />
      <StatCard
        icon={<Medal size={22} />}
        value={stats.podiums}
        label="Podiums"
        delay={0.2}
      />
      <StatCard
        icon={<TrendingUp size={22} />}
        value={stats.points}
        label="Points"
        delay={0.3}
      />
      <StatCard
        icon={<AlertTriangle size={22} />}
        value={stats.dnfs}
        label="DNFs"
        delay={0.4}
      />
    </div>
  );
}
