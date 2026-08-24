import React from 'react';
import { Zap, Gamepad2, Activity, Radio, Shield } from 'lucide-react';
import { ActiveSession } from '../types';

interface HeaderProps {
  activeSession: ActiveSession | null;
  rigCount: number;
  onlineCount: number;
  onOpenTestModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSession,
  rigCount,
  onlineCount,
  onOpenTestModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0e]/95 backdrop-blur-xl border-b border-[#ffffff10] shadow-2xl px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-[0_0_18px_rgba(79,70,229,0.55)] border border-indigo-400/30">
              <Zap className="w-5 h-5 text-white fill-white animate-pulse" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0a0e] shadow-[0_0_8px_#10b981]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1">
                PARSEC<span className="text-indigo-400">WAKE</span>
              </h1>
              <span className="text-[9px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                v4.2 PRO
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-mono">
              Cross-Subnet WoL & Host Bridge
            </p>
          </div>
        </div>

        {/* Right side controls & telemetry */}
        <div className="flex items-center gap-3">
          {/* Network Node Status Pill */}
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">Network Nodes</span>
            <span className="text-xs font-mono text-indigo-400 font-semibold">{onlineCount}/{rigCount} Online</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1b23] border border-[#ffffff15] shadow-inner text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span className="text-gray-300 font-mono text-[11px] font-medium sm:hidden">
              {onlineCount}/{rigCount}
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-semibold hidden sm:inline">
              READY
            </span>
          </div>

          {/* Quick Packet Test Button */}
          <button
            onClick={onOpenTestModal}
            title="Manual WoL Magic Packet Dispatcher"
            className="w-9 h-9 rounded-xl bg-[#1a1b23] hover:bg-indigo-600/20 active:scale-95 text-indigo-300 hover:text-white border border-[#ffffff15] hover:border-indigo-500/40 transition-all flex items-center justify-center shadow-lg"
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Session Holographic Warning Bar */}
      {activeSession && (
        <div className="max-w-2xl mx-auto mt-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-950/80 via-[#0f1016] to-[#0a0a0e] border border-indigo-500/40 flex items-center justify-between text-xs shadow-[0_0_20px_rgba(79,70,229,0.2)]">
          <div className="flex items-center gap-2.5 text-indigo-300">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Gamepad2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            </div>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-mono">Stream Active:</span>
            <span className="font-bold text-white tracking-wide">{activeSession.rigName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
              ~{activeSession.estimatedWattage}W
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
