"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Trophy, Flag } from "lucide-react";
import LapPositionChart from "@/components/race-detail/LapPositionChart";
import TireStrategy from "@/components/race-detail/TireStrategy";
import PitStopChart from "@/components/race-detail/PitStopChart";
import RaceControlTimeline from "@/components/race-detail/RaceControlTimeline";
import WeatherTimeline from "@/components/race-detail/WeatherTimeline";
import TeamRadioList from "@/components/race-detail/TeamRadioList";
import StartingGrid from "@/components/race-detail/StartingGrid";
import QualifyingSectors from "@/components/race-detail/QualifyingSectors";
import { getTeamColor } from "@/lib/team-colors";

export default function RaceDetailPage() {
  const params = useParams<{ season: string; round: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/race-detail/${params.season}/${params.round}`);
        if (!res.ok) throw new Error("Failed to load race data");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.season, params.round]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="card animate-pulse h-32" />
        <div className="card animate-pulse h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card flex items-center justify-center py-16">
        <p className="text-f1-white/50">{error ?? "Race not found"}</p>
      </div>
    );
  }

  const { race, results, qualifying, pitStops, lapTimings, openF1 } = data;

  // Build lap position data from Jolpica lap timings
  const lapPositionData = lapTimings.map((lap: any) => {
    const positions: Record<string, number> = {};
    for (const timing of lap.Timings) {
      positions[timing.driverId] = parseInt(timing.position);
    }
    return { lap: parseInt(lap.number), positions };
  });

  const driverInfoMap = new Map(
    results.map((r: any) => [
      r.driverId,
      {
        driverId: r.driverId,
        code: r.driver.code ?? r.driver.lastName.substring(0, 3).toUpperCase(),
        color: r.constructor.colorPrimary ?? getTeamColor(r.constructorId),
      },
    ])
  );
  const lapChartDrivers = Array.from(driverInfoMap.values());

  // Build tire strategy data from OpenF1 stints
  const openF1DriverMap = new Map<number, any>(
    openF1.drivers.map((d: any) => [d.driver_number, d])
  );

  const stintsByDriver = new Map<number, any[]>();
  for (const stint of openF1.stints) {
    const existing = stintsByDriver.get(stint.driver_number) ?? [];
    existing.push(stint);
    stintsByDriver.set(stint.driver_number, existing);
  }

  const tireDrivers = Array.from(stintsByDriver.entries())
    .map(([driverNumber, stints]) => {
      const driverInfo = openF1DriverMap.get(driverNumber);
      return {
        driverNumber,
        abbreviation: driverInfo?.name_acronym ?? `#${driverNumber}`,
        teamColor: driverInfo?.team_colour ? `#${driverInfo.team_colour}` : "#666",
        stints: stints.map((s: any) => ({
          compound: s.compound ?? "UNKNOWN",
          lapStart: s.lap_start ?? 1,
          lapEnd: s.lap_end ?? s.lap_start ?? 1,
          tyreAge: s.tyre_age_at_start ?? 0,
        })),
      };
    })
    .sort((a, b) => {
      const posA = results.findIndex((r: any) => {
        const dInfo = openF1DriverMap.get(a.driverNumber);
        return dInfo && r.driver.code === dInfo.name_acronym;
      });
      const posB = results.findIndex((r: any) => {
        const dInfo = openF1DriverMap.get(b.driverNumber);
        return dInfo && r.driver.code === dInfo.name_acronym;
      });
      return (posA === -1 ? 99 : posA) - (posB === -1 ? 99 : posB);
    });

  const totalLaps = results[0]?.laps ?? 0;

  // Build pit stop data
  const pitStopData = pitStops.map((ps: any) => {
    const result = results.find((r: any) => r.driverId === ps.driverId);
    return {
      driverId: ps.driverId,
      driverCode: result?.driver?.code ?? ps.driverId.substring(0, 3).toUpperCase(),
      teamColor: result?.constructor?.colorPrimary ?? getTeamColor(result?.constructorId ?? ""),
      lap: parseInt(ps.lap),
      stop: parseInt(ps.stop),
      duration: ps.duration,
    };
  });

  // Build race control data
  const raceControlEvents = openF1.raceControl.map((rc: any) => ({
    date: rc.date,
    category: rc.category,
    flag: rc.flag,
    message: rc.message,
    driverNumber: rc.driver_number,
    lapNumber: rc.lap_number,
    scope: rc.scope,
  }));

  // Build weather data
  const weatherReadings = openF1.weather.map((w: any) => ({
    date: w.date,
    airTemp: w.air_temperature,
    trackTemp: w.track_temperature,
    humidity: w.humidity,
    windSpeed: w.wind_speed,
    windDirection: w.wind_direction,
    rainfall: w.rainfall,
  }));

  // Build team radio data
  const radioMessages = openF1.teamRadio.map((tr: any) => {
    const driverInfo = openF1DriverMap.get(tr.driver_number);
    return {
      driverNumber: tr.driver_number,
      driverName: driverInfo?.full_name ?? driverInfo?.name_acronym ?? `#${tr.driver_number}`,
      teamColor: driverInfo?.team_colour ? `#${driverInfo.team_colour}` : "#666",
      date: tr.date,
      recordingUrl: tr.recording_url,
    };
  });

  // Build starting grid data
  const gridDrivers = qualifying.map((q: any) => ({
    position: q.position ?? 99,
    driverCode: q.driver.code ?? q.driver.lastName.substring(0, 3).toUpperCase(),
    driverName: `${q.driver.firstName} ${q.driver.lastName}`,
    constructorName: q.constructor.name,
    teamColor: q.constructor.colorPrimary ?? getTeamColor(q.constructorId),
    q3Time: q.q3 ?? q.q2 ?? q.q1 ?? null,
  }));

  // Build qualifying sectors data from OpenF1 laps
  const sectorDrivers = openF1.laps.length > 0
    ? (() => {
        const bestLaps = new Map<number, any>();
        for (const lap of openF1.laps) {
          if (!lap.duration_sector_1 || !lap.duration_sector_2 || !lap.duration_sector_3) continue;
          const existing = bestLaps.get(lap.driver_number);
          const total = lap.duration_sector_1 + lap.duration_sector_2 + lap.duration_sector_3;
          if (!existing || total < existing.total) {
            bestLaps.set(lap.driver_number, { ...lap, total });
          }
        }

        const allS1 = Array.from(bestLaps.values()).map((l) => l.duration_sector_1);
        const allS2 = Array.from(bestLaps.values()).map((l) => l.duration_sector_2);
        const allS3 = Array.from(bestLaps.values()).map((l) => l.duration_sector_3);

        if (allS1.length === 0) return null;

        const bs1 = Math.min(...allS1);
        const bs2 = Math.min(...allS2);
        const bs3 = Math.min(...allS3);

        const sectorData = Array.from(bestLaps.entries())
          .map(([driverNumber, lap]) => {
            const dInfo = openF1DriverMap.get(driverNumber);
            const result = results.find((r: any) => r.driver.code === dInfo?.name_acronym);
            return {
              driverCode: dInfo?.name_acronym ?? `#${driverNumber}`,
              teamColor: dInfo?.team_colour ? `#${dInfo.team_colour}` : "#666",
              position: result?.position ?? 99,
              s1: lap.duration_sector_1,
              s2: lap.duration_sector_2,
              s3: lap.duration_sector_3,
              totalTime: lap.total,
              speedTrap: lap.st_speed,
            };
          })
          .sort((a, b) => a.totalTime - b.totalTime);

        return { drivers: sectorData, bestS1: bs1, bestS2: bs2, bestS3: bs3 };
      })()
    : null;

  const raceDate = new Date(race.date).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="card relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 70%, #1A1A1A 100%)",
      }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          background: "radial-gradient(ellipse at bottom right, rgba(225,6,0,0.4), transparent 60%)",
        }} />
        <div className="relative z-10">
          <Link href="/results" className="inline-flex items-center gap-1.5 text-xs text-f1-white/40 hover:text-f1-white transition-colors mb-4">
            <ArrowLeft size={14} /> Back to Results
          </Link>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-f1-white mb-2">{race.raceName}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-f1-white/50">
            <span className="flex items-center gap-1"><MapPin size={14} className="text-f1-red" />{race.circuit.name}</span>
            <span className="text-f1-white/20">|</span>
            <span>{race.circuit.country}</span>
            <span className="text-f1-white/20">|</span>
            <span className="flex items-center gap-1"><Calendar size={14} />{raceDate}</span>
            <span className="text-f1-white/20">|</span>
            <span className="font-mono">Round {race.round}</span>
          </div>
          {results.length > 0 && results[0].position === 1 && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-md bg-f1-carbon/30 border border-f1-yellow/20 w-fit">
              <Trophy size={16} className="text-f1-yellow" />
              <span className="text-sm font-heading font-bold text-f1-yellow">{results[0].driver.firstName} {results[0].driver.lastName}</span>
              <span className="text-xs text-f1-white/40">— {results[0].constructor.name}</span>
            </div>
          )}
        </div>
      </div>

      {gridDrivers.length > 0 && <StartingGrid drivers={gridDrivers} />}

      {lapPositionData.length > 0 && (
        <LapPositionChart data={lapPositionData} drivers={lapChartDrivers as any} totalLaps={totalLaps} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tireDrivers.length > 0 && <TireStrategy drivers={tireDrivers} totalLaps={totalLaps} />}
        {pitStopData.length > 0 && <PitStopChart pitStops={pitStopData} />}
      </div>

      {sectorDrivers && sectorDrivers.drivers.length > 0 && (
        <QualifyingSectors drivers={sectorDrivers.drivers} bestS1={sectorDrivers.bestS1} bestS2={sectorDrivers.bestS2} bestS3={sectorDrivers.bestS3} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {raceControlEvents.length > 0 && <RaceControlTimeline events={raceControlEvents} />}
        {weatherReadings.length > 0 && <WeatherTimeline readings={weatherReadings} />}
      </div>

      {radioMessages.length > 0 && <TeamRadioList messages={radioMessages} />}

      {/* Full Results Table */}
      {results.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-f1-gray/30 bg-f1-carbon/20">
            <Flag size={16} className="text-f1-red" />
            <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider">Race Classification</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-f1-white/40 border-b border-f1-gray/20">
                  <th className="text-left px-4 py-2">Pos</th>
                  <th className="text-left px-4 py-2">Driver</th>
                  <th className="text-left px-4 py-2">Team</th>
                  <th className="text-center px-4 py-2">Grid</th>
                  <th className="text-center px-4 py-2">Laps</th>
                  <th className="text-right px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r: any) => (
                  <tr key={r.id} className="border-b border-f1-gray/10 hover:bg-f1-carbon/20">
                    <td className="px-4 py-2 font-mono font-bold text-f1-white">{r.positionText ?? "—"}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: r.constructor.colorPrimary ?? "#666" }} />
                        <span className="text-f1-white font-medium">{r.driver.firstName} {r.driver.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-f1-white/50">{r.constructor.name}</td>
                    <td className="px-4 py-2 text-center font-mono text-f1-white/60">{r.grid}</td>
                    <td className="px-4 py-2 text-center font-mono text-f1-white/60">{r.laps}</td>
                    <td className="px-4 py-2 text-right text-f1-white/50">{r.status}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-f1-white">{r.points > 0 ? r.points : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
