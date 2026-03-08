"use client";

import { motion } from "framer-motion";

interface QualifyingRow {
  id: number;
  position: number | null;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  driver: {
    driverId: string;
    firstName: string;
    lastName: string;
    code: string | null;
  };
  constructor: {
    constructorId: string;
    name: string;
    colorPrimary: string | null;
  };
}

interface QualifyingTableProps {
  results: QualifyingRow[];
}

function findFastestTime(results: QualifyingRow[], session: "q1" | "q2" | "q3"): string | null {
  let fastest: string | null = null;
  for (const r of results) {
    const time = r[session];
    if (time && (fastest === null || time < fastest)) {
      fastest = time;
    }
  }
  return fastest;
}

export default function QualifyingTable({ results }: QualifyingTableProps) {
  if (results.length === 0) {
    return (
      <div className="card flex items-center justify-center py-16">
        <p className="text-f1-white/30 text-sm">No qualifying results available</p>
      </div>
    );
  }

  const fastestQ1 = findFastestTime(results, "q1");
  const fastestQ2 = findFastestTime(results, "q2");
  const fastestQ3 = findFastestTime(results, "q3");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-f1-carbon text-f1-white/40 text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-3 font-medium w-14">Pos</th>
            <th className="text-left py-3 px-3 font-medium">Driver</th>
            <th className="text-left py-3 px-3 font-medium hidden md:table-cell">Team</th>
            <th className="text-right py-3 px-3 font-medium">Q1</th>
            <th className="text-right py-3 px-3 font-medium">Q2</th>
            <th className="text-right py-3 px-3 font-medium">Q3</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => {
            const knockedOutQ1 = result.q2 === null && result.position !== null && result.position > 15;
            const knockedOutQ2 = result.q3 === null && result.position !== null && result.position > 10;

            return (
              <motion.tr
                key={result.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className={`border-b border-f1-carbon/50 hover:bg-f1-carbon/20 transition-colors duration-150
                  ${knockedOutQ1 ? "opacity-50" : ""}`}
              >
                {/* Position */}
                <td className="py-3 px-3">
                  <span className="font-mono text-sm text-f1-white/70">
                    {result.position ?? "—"}
                  </span>
                </td>

                {/* Driver */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: result.constructor.colorPrimary || "#3D3D3D" }}
                    />
                    <span className="text-f1-white font-medium">
                      {result.driver.firstName} <span className="font-semibold">{result.driver.lastName}</span>
                    </span>
                  </div>
                </td>

                {/* Team */}
                <td className="py-3 px-3 text-f1-white/50 hidden md:table-cell">
                  {result.constructor.name}
                </td>

                {/* Q1 */}
                <td className="py-3 px-3 text-right">
                  {result.q1 ? (
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded ${
                        result.q1 === fastestQ1
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "text-f1-white/60"
                      }`}
                    >
                      {result.q1}
                    </span>
                  ) : (
                    <span className="text-f1-white/20">—</span>
                  )}
                </td>

                {/* Q2 */}
                <td className="py-3 px-3 text-right">
                  {result.q2 ? (
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded ${
                        result.q2 === fastestQ2
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "text-f1-white/60"
                      }`}
                    >
                      {result.q2}
                    </span>
                  ) : (
                    <span className={`text-f1-white/20 ${knockedOutQ1 ? "" : ""}`}>—</span>
                  )}
                </td>

                {/* Q3 */}
                <td className="py-3 px-3 text-right">
                  {result.q3 ? (
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded ${
                        result.q3 === fastestQ3
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "text-f1-white/60"
                      }`}
                    >
                      {result.q3}
                    </span>
                  ) : (
                    <span className="text-f1-white/20">—</span>
                  )}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
