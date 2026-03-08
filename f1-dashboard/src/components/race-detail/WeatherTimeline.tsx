"use client";
import { Cloud, Thermometer, Droplets, Wind } from "lucide-react";

interface WeatherReading { date: string; airTemp: number; trackTemp: number; humidity: number; windSpeed: number; windDirection: number; rainfall: number; }
interface WeatherTimelineProps { readings: WeatherReading[]; }

export default function WeatherTimeline({ readings }: WeatherTimelineProps) {
  if (readings.length === 0) {
    return (
      <div className="card flex items-center justify-center py-8">
        <p className="text-f1-white/30 text-sm">No weather data available</p>
      </div>
    );
  }
  const end = readings[readings.length - 1];
  const hadRain = readings.some((r) => r.rainfall > 0);
  const maxTrackTemp = Math.max(...readings.map((r) => r.trackTemp));
  const minTrackTemp = Math.min(...readings.map((r) => r.trackTemp));
  return (
    <div className="card p-4">
      <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider mb-4">Weather Conditions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="flex items-center gap-2 bg-f1-carbon/30 rounded-lg px-3 py-2">
          <Thermometer size={16} className="text-orange-400 shrink-0" />
          <div><p className="text-[10px] text-f1-white/40 uppercase">Air</p><p className="text-sm font-mono text-f1-white">{end.airTemp}&deg;C</p></div>
        </div>
        <div className="flex items-center gap-2 bg-f1-carbon/30 rounded-lg px-3 py-2">
          <Thermometer size={16} className="text-red-400 shrink-0" />
          <div><p className="text-[10px] text-f1-white/40 uppercase">Track</p><p className="text-sm font-mono text-f1-white">{minTrackTemp}&ndash;{maxTrackTemp}&deg;C</p></div>
        </div>
        <div className="flex items-center gap-2 bg-f1-carbon/30 rounded-lg px-3 py-2">
          <Droplets size={16} className="text-blue-400 shrink-0" />
          <div><p className="text-[10px] text-f1-white/40 uppercase">Humidity</p><p className="text-sm font-mono text-f1-white">{end.humidity}%</p></div>
        </div>
        <div className="flex items-center gap-2 bg-f1-carbon/30 rounded-lg px-3 py-2">
          <Wind size={16} className="text-cyan-400 shrink-0" />
          <div><p className="text-[10px] text-f1-white/40 uppercase">Wind</p><p className="text-sm font-mono text-f1-white">{end.windSpeed} km/h</p></div>
        </div>
      </div>
      {hadRain && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-500/10 border border-blue-500/20">
          <Cloud size={14} className="text-blue-400" />
          <span className="text-xs text-blue-300 font-semibold">Rain detected during session</span>
        </div>
      )}
    </div>
  );
}
