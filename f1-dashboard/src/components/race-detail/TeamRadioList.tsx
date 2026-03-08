"use client";
import { useState, useRef } from "react";
import { Play, Pause, Radio } from "lucide-react";

interface RadioMessage { driverNumber: number; driverName: string; teamColor: string; date: string; recordingUrl: string; }
interface TeamRadioListProps { messages: RadioMessage[]; }

function RadioItem({ message }: { message: RadioMessage }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
  };
  const time = new Date(message.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 border-b border-f1-gray/10 hover:bg-f1-carbon/20 transition-colors">
      <button onClick={togglePlay} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors" style={{ backgroundColor: playing ? `${message.teamColor}30` : "transparent", border: `1px solid ${message.teamColor}50` }}>
        {playing ? <Pause size={14} style={{ color: message.teamColor }} /> : <Play size={14} className="ml-0.5" style={{ color: message.teamColor }} />}
      </button>
      <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: message.teamColor }} />
      <div className="flex-1 min-w-0"><p className="text-sm font-bold text-f1-white truncate">{message.driverName}</p></div>
      <span className="text-[10px] text-f1-white/30 font-mono shrink-0">{time}</span>
      <audio ref={audioRef} src={message.recordingUrl} onEnded={() => setPlaying(false)} preload="none" />
    </div>
  );
}

export default function TeamRadioList({ messages }: TeamRadioListProps) {
  if (messages.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12">
        <p className="text-f1-white/30 text-sm">No team radio available</p>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-f1-gray/30 bg-f1-carbon/20">
        <Radio size={16} className="text-f1-cyan" />
        <h3 className="font-heading text-sm font-bold text-f1-white/80 uppercase tracking-wider">Team Radio</h3>
        <span className="text-[10px] text-f1-white/30 ml-auto">{messages.length} messages</span>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {messages.map((msg, i) => <RadioItem key={i} message={msg} />)}
      </div>
    </div>
  );
}
