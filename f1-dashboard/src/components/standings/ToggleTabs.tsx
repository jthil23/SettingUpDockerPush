"use client";

import { motion } from "framer-motion";

interface ToggleTabsProps {
  options: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export default function ToggleTabs({
  options,
  activeIndex,
  onChange,
}: ToggleTabsProps) {
  return (
    <div className="flex gap-1 bg-f1-dark rounded-lg p-1 border border-f1-carbon w-fit">
      {options.map((option, index) => (
        <button
          key={option}
          onClick={() => onChange(index)}
          className="relative px-5 py-2 text-sm font-heading font-semibold rounded-md transition-colors"
        >
          {activeIndex === index && (
            <motion.div
              layoutId="standings-tab-indicator"
              className="absolute inset-0 bg-f1-red rounded-md"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span
            className={`relative z-10 ${
              activeIndex === index ? "text-f1-white" : "text-f1-white/50"
            }`}
          >
            {option}
          </span>
        </button>
      ))}
    </div>
  );
}
