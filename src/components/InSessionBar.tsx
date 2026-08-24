import React, { useEffect, useState } from 'react';
import {
  Gamepad2,
  Clock,
  Zap,
  Square,
  MonitorPlay,
} from 'lucide-react';
import { ActiveSession, GamingRig } from '../types';
import { launchParsecSession } from '../services/parsecService';

interface InSessionBarProps {
  session: ActiveSession | null;
  rigs: GamingRig[];
  onEndSession: () => void;
}

export const InSessionBar: React.FC<InSessionBarProps> = ({
  session,
  rigs,
  onEndSession,
}) => {
  if (!session) return null;

  const [elapsed, setElapsed] = useState(session.elapsedSeconds || 0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const startTime = new Date(session.startedAt).getTime();
      const currentSeconds = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(currentSeconds > 0 ? currentSeconds : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [session.startedAt]);

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  const hoursPlayed = elapsed / 3600;
  const kwhUsed = (session.estimatedWattage / 1000) * hoursPlayed;
  const cost = kwhUsed * (session.kwhCostUsd || 0.16);

  const currentRig = rigs.find((r) => r.id === session.rigId);

  const handleReconnect = () => {
    if (currentRig) {
      launchParsecSession(currentRig);
    }
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 z-30 px-4 py-2 pointer-events-none">
      <div className="max-w-xl mx-auto rounded-2xl bg-gradient-to-r from-[#12141d]/95 via-[#0f1016]/95 to-[#12141d]/95 border border-indigo-500/40 shadow-[0_0_30px_rgba(79,70,229,0.3)] backdrop-blur-xl p-3 text-white pointer-events-auto flex items-center justify-between gap-3">
        {/* Left: Rig info & Live Time */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-400/30">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f1016] shadow-[0_0_8px_#10b981] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white tracking-wide">{session.rigName}</span>
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                STREAMING
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
              <span className="flex items-center gap-1 font-bold text-indigo-300">
                <Clock className="w-3 h-3 text-indigo-400" />
                {formatTime(elapsed)}
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-amber-400" />
                {session.estimatedWattage}W
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-emerald-400 font-bold">
                ${cost.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* Right buttons: Reconnect & End Session */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReconnect}
            title="Focus / Reopen Parsec Stream"
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-95 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connect</span>
          </button>

          <button
            onClick={onEndSession}
            title="End Session & Reset Timer"
            className="w-8 h-8 rounded-xl bg-[#1a1b23] hover:bg-red-500/20 hover:text-red-400 active:scale-95 text-gray-400 border border-[#ffffff10] hover:border-red-500/30 transition-all flex items-center justify-center"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
