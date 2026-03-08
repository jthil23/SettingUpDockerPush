"use client";

import { useState } from "react";
import {
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Calendar,
  Users,
  Trophy,
  Flag,
  Map,
  Target,
  Activity,
  Zap,
} from "lucide-react";

interface SyncLog {
  id: number;
  entity: string;
  status: string;
  recordsUpdated: number;
  lastSynced: string;
}

interface DbStats {
  seasons: number;
  circuits: number;
  races: number;
  drivers: number;
  constructors: number;
  results: number;
  qualifyingResults: number;
  predictions: number;
}

interface ApiHealth {
  name: string;
  status: "online" | "offline";
  latencyMs: number;
}

interface Props {
  dbStats: DbStats;
  recentSyncs: SyncLog[];
  currentYear: number;
  races: { round: number; raceName: string }[];
}

const STAT_ITEMS: { key: keyof DbStats; label: string; icon: typeof Database }[] = [
  { key: "seasons", label: "Seasons", icon: Calendar },
  { key: "circuits", label: "Circuits", icon: Map },
  { key: "races", label: "Races", icon: Flag },
  { key: "drivers", label: "Drivers", icon: Users },
  { key: "constructors", label: "Constructors", icon: Trophy },
  { key: "results", label: "Results", icon: Target },
  { key: "qualifyingResults", label: "Qualifying", icon: Clock },
  { key: "predictions", label: "Predictions", icon: Zap },
];

export default function AdminClient({ dbStats, recentSyncs, currentYear, races }: Props) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(races[0]?.round ?? 1);
  const [apiHealth, setApiHealth] = useState<{ jolpica: ApiHealth; openF1: ApiHealth } | null>(null);
  const [checkingApis, setCheckingApis] = useState(false);

  async function triggerSync(action: string, round?: number) {
    setSyncing(action);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, year: currentYear, round }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage({ text: data.message, type: "success" });
      } else {
        setSyncMessage({ text: data.error || "Sync failed", type: "error" });
      }
    } catch {
      setSyncMessage({ text: "Network error", type: "error" });
    } finally {
      setSyncing(null);
    }
  }

  async function checkApiHealth() {
    setCheckingApis(true);
    try {
      const res = await fetch("/api/admin/status");
      const data = await res.json();
      if (data.apis) {
        setApiHealth(data.apis);
      }
    } catch {
      // ignore
    } finally {
      setCheckingApis(false);
    }
  }

  function formatTimeAgo(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white">
        Admin
      </h1>

      {/* API Health */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold text-f1-white flex items-center gap-2">
            <Activity size={18} className="text-f1-cyan" />
            API Status
          </h2>
          <button
            onClick={checkApiHealth}
            disabled={checkingApis}
            className="flex items-center gap-1.5 text-xs font-mono text-f1-white/60 hover:text-f1-white transition-colors disabled:opacity-50"
          >
            {checkingApis ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Check
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ApiCard
            name="Jolpica (Ergast)"
            url="api.jolpi.ca/ergast/f1"
            description="Historical race data, standings, results"
            health={apiHealth?.jolpica ?? null}
          />
          <ApiCard
            name="OpenF1"
            url="api.openf1.org/v1"
            description="Live timing, positions, intervals"
            health={apiHealth?.openF1 ?? null}
          />
        </div>
      </section>

      {/* Database Stats */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-f1-white flex items-center gap-2 mb-3">
          <Database size={18} className="text-f1-cyan" />
          Database
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAT_ITEMS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="card flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-f1-white/50 text-xs">
                <Icon size={13} />
                {label}
              </div>
              <span className="font-heading text-2xl font-bold text-f1-white">
                {dbStats[key].toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Sync Controls & Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sync Controls */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-f1-white flex items-center gap-2 mb-3">
            <RefreshCw size={18} className="text-f1-cyan" />
            Sync Controls
          </h2>
          <div className="card flex flex-col gap-3">
            {/* Sync message */}
            {syncMessage && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  syncMessage.type === "success"
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {syncMessage.type === "success" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {syncMessage.text}
              </div>
            )}

            <SyncButton
              label="Full Sync"
              description={`Sync everything for ${currentYear}`}
              action="full"
              syncing={syncing}
              onSync={() => triggerSync("full")}
              variant="primary"
            />
            <SyncButton
              label="Season Schedule"
              description="Races, circuits, session times"
              action="season"
              syncing={syncing}
              onSync={() => triggerSync("season")}
            />
            <SyncButton
              label="Drivers & Constructors"
              description="Driver and team rosters"
              action="drivers"
              syncing={syncing}
              onSync={() => triggerSync("drivers")}
            />
            <SyncButton
              label="Standings"
              description="Driver and constructor championships"
              action="standings"
              syncing={syncing}
              onSync={() => triggerSync("standings")}
            />

            {/* Results sync with round selector */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-f1-carbon/30 border border-f1-carbon">
              <div className="flex-1">
                <p className="text-sm font-medium text-f1-white">Race Results</p>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                  className="mt-1 text-xs bg-f1-dark border border-f1-carbon rounded px-2 py-1 text-f1-white/80 w-full"
                >
                  {races.map((r) => (
                    <option key={r.round} value={r.round}>
                      R{r.round} — {r.raceName}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => triggerSync("results", selectedRound)}
                disabled={syncing !== null || races.length === 0}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-f1-carbon hover:bg-f1-gray text-f1-white transition-colors disabled:opacity-50"
              >
                {syncing === "results" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Sync
              </button>
            </div>

            {/* Cron Schedule Info */}
            <div className="mt-2 pt-3 border-t border-f1-carbon">
              <p className="text-xs font-medium text-f1-white/50 mb-2">Automatic Schedule</p>
              <div className="space-y-1.5 text-xs text-f1-white/40 font-mono">
                <p><span className="text-f1-cyan/60">startup</span> — full sync</p>
                <p><span className="text-f1-cyan/60">0 * * * *</span> — hourly standings + missing results</p>
                <p><span className="text-f1-cyan/60">*/15 * * * 5,6,0</span> — race weekend (Fri-Sun, every 15m)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sync Log */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-f1-white flex items-center gap-2 mb-3">
            <Clock size={18} className="text-f1-cyan" />
            Recent Sync Log
          </h2>
          <div className="card p-0 overflow-hidden">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-f1-dark border-b border-f1-carbon">
                  <tr className="text-left text-f1-white/50 text-xs">
                    <th className="px-4 py-2.5">Entity</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Records</th>
                    <th className="px-4 py-2.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSyncs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-f1-white/30">
                        No sync history yet
                      </td>
                    </tr>
                  ) : (
                    recentSyncs.map((log) => (
                      <tr key={log.id} className="border-b border-f1-carbon/50 hover:bg-f1-carbon/20 transition-colors">
                        <td className="px-4 py-2 font-mono text-xs text-f1-white/80">{log.entity}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center gap-1 text-xs ${
                              log.status === "success" ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {log.status === "success" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-xs text-f1-white/60">
                          {log.recordsUpdated}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-f1-white/40" title={log.lastSynced}>
                          {formatTimeAgo(log.lastSynced)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ApiCard({
  name,
  url,
  description,
  health,
}: {
  name: string;
  url: string;
  description: string;
  health: ApiHealth | null;
}) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <h3 className="text-sm font-semibold text-f1-white">{name}</h3>
        <p className="text-xs text-f1-white/40 font-mono mt-0.5">{url}</p>
        <p className="text-xs text-f1-white/50 mt-1">{description}</p>
      </div>
      <div className="shrink-0 ml-4">
        {health === null ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-f1-white/30">
            <span className="w-2 h-2 rounded-full bg-f1-white/20" />
            Unknown
          </span>
        ) : health.status === "online" ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {health.latencyMs}ms
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Offline
          </span>
        )}
      </div>
    </div>
  );
}

function SyncButton({
  label,
  description,
  action,
  syncing,
  onSync,
  variant = "default",
}: {
  label: string;
  description: string;
  action: string;
  syncing: string | null;
  onSync: () => void;
  variant?: "primary" | "default";
}) {
  const isActive = syncing === action;
  const disabled = syncing !== null;

  return (
    <button
      onClick={onSync}
      disabled={disabled}
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors text-left disabled:opacity-50 ${
        variant === "primary"
          ? "bg-f1-red/10 border-f1-red/30 hover:bg-f1-red/20"
          : "bg-f1-carbon/30 border-f1-carbon hover:bg-f1-carbon/50"
      }`}
    >
      <div>
        <p className={`text-sm font-medium ${variant === "primary" ? "text-f1-red" : "text-f1-white"}`}>
          {label}
        </p>
        <p className="text-xs text-f1-white/40">{description}</p>
      </div>
      {isActive ? (
        <Loader2 size={16} className="animate-spin text-f1-white/60" />
      ) : (
        <RefreshCw size={16} className="text-f1-white/40" />
      )}
    </button>
  );
}
