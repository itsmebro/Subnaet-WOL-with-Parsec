import React, { useState } from 'react';
import {
  Zap,
  MonitorPlay,
  Activity,
  Settings,
  MoreVertical,
  Network,
  Power,
  Tv,
  Laptop,
  Gamepad2,
  Server,
  Monitor,
  ExternalLink,
  Flame,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { GamingRig, WolStrategy } from '../types';
import { getParsecUri, getParsecWebUrl } from '../services/parsecService';

interface RigCardProps {
  rig: GamingRig;
  onWake: (rig: GamingRig) => void;
  onEdit: (rig: GamingRig) => void;
  onPing: (rig: GamingRig) => void;
  onLaunchParsec: (rig: GamingRig) => void;
  onStartSession: (rig: GamingRig) => void;
  isPinging?: boolean;
}

const STRATEGY_BADGES: Record<
  WolStrategy,
  { label: string; bg: string; text: string; border: string }
> = {
  directed_broadcast: {
    label: 'Subnet Broadcast',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-300',
    border: 'border-indigo-500/20',
  },
  relay_agent: {
    label: 'Subnet Relay Daemon',
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    border: 'border-purple-500/20',
  },
  tailscale_vpn: {
    label: 'Tailscale Subnet',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/20',
  },
  wan_port_forward: {
    label: 'WAN Port Forward',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-500/20',
  },
  ssh_bridge: {
    label: 'SSH Router Bridge',
    bg: 'bg-blue-500/10',
    text: 'text-blue-300',
    border: 'border-blue-500/20',
  },
};

export const RigCard: React.FC<RigCardProps> = ({
  rig,
  onWake,
  onEdit,
  onPing,
  onLaunchParsec,
  onStartSession,
  isPinging = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const getRigIcon = () => {
    switch (rig.icon) {
      case 'laptop':
        return <Laptop className="w-5 h-5" />;
      case 'server':
        return <Server className="w-5 h-5" />;
      case 'tv':
        return <Tv className="w-5 h-5" />;
      case 'gamepad':
        return <Gamepad2 className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const isOnline = rig.status === 'online' || rig.status === 'in_session';
  const isWaking = rig.status === 'waking';
  const strategyInfo = STRATEGY_BADGES[rig.strategy] || STRATEGY_BADGES.directed_broadcast;

  const copyMac = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rig.mac);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-[#12141d] to-[#0a0a0e] border border-[#ffffff10] p-5 shadow-2xl transition-all duration-300 hover:border-indigo-500/30 group">
      {/* Top Header info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          {/* Rig Avatar Icon with Neon Ring */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 relative overflow-hidden"
            style={{
              backgroundColor: `${rig.color || '#4f46e5'}20`,
              color: rig.color || '#818cf8',
            }}
          >
            <div
              className="absolute inset-0 opacity-20 blur-sm"
              style={{ backgroundColor: rig.color || '#4f46e5' }}
            />
            <span className="relative z-10">{getRigIcon()}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">{rig.name}</h3>
              {/* Status Pill Badge */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1a1b23] border border-[#ffffff10]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline
                      ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                      : isWaking
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                  }`}
                />
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider ${
                    isOnline
                      ? 'text-emerald-400'
                      : isWaking
                      ? 'text-amber-300'
                      : 'text-red-400'
                  }`}
                >
                  {rig.status === 'in_session' ? 'In Session' : rig.status}
                </span>
              </div>
            </div>

            {/* Target IP & MAC */}
            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-1">
              <span className="text-indigo-400">{rig.targetIp}</span>
              <span className="text-gray-600">•</span>
              <button
                onClick={copyMac}
                className="hover:text-white transition-colors flex items-center gap-1 group/btn"
                title="Click to copy MAC"
              >
                <span>{rig.mac}</span>
                {copied ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                ) : (
                  <Copy className="w-2.5 h-2.5 text-gray-500 group-hover/btn:text-indigo-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-xl bg-[#1a1b23] border border-[#ffffff08] text-gray-400 hover:text-white hover:border-[#ffffff20] transition-colors flex items-center justify-center"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-10 z-30 w-48 rounded-2xl bg-[#0f1016] border border-[#ffffff15] shadow-2xl p-1.5 text-xs backdrop-blur-xl"
              onClick={() => setShowMenu(false)}
            >
              <button
                onClick={() => onPing(rig)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#1a1b23] text-gray-300 hover:text-white transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>Probe Ping / Port</span>
              </button>
              <button
                onClick={() => onEdit(rig)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#1a1b23] text-gray-300 hover:text-white transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-gray-400" />
                <span>Edit Rig Profile</span>
              </button>
              <a
                href={getParsecWebUrl(rig)}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#1a1b23] text-gray-300 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Parsec Web App</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Hardware / Network Specification Chips */}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <span
          className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border ${strategyInfo.bg} ${strategyInfo.text} ${strategyInfo.border}`}
        >
          {strategyInfo.label}
        </span>
        {rig.vendor && (
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#1a1b23] text-gray-300 border border-[#ffffff08]">
            {rig.vendor}
          </span>
        )}
        {rig.parsecPreset && (
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold">
            {rig.parsecPreset.resolution} • {rig.parsecPreset.fps} FPS
          </span>
        )}
        {rig.latencyMs !== undefined && (
          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full ${
              rig.latencyMs < 30
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}
          >
            {rig.latencyMs}ms Latency
          </span>
        )}
      </div>

      {/* Hardware Specs summary */}
      {rig.specSummary && (
        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#00000030] border border-[#ffffff05]">
          <p className="text-[11px] text-gray-400 line-clamp-1 font-mono">
            {rig.specSummary}
          </p>
        </div>
      )}

      {/* Quick Launch Games / Apps bar */}
      {rig.quickGames && rig.quickGames.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#ffffff08] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono shrink-0 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            Quick:
          </span>
          {rig.quickGames.map((game) => (
            <a
              key={game.id}
              href={
                game.customUri ||
                (game.appId ? `steam://run/${game.appId}` : getParsecUri(rig))
              }
              title={game.name}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[#1a1b23] hover:bg-indigo-600/20 text-gray-300 hover:text-white border border-[#ffffff08] hover:border-indigo-500/30 transition-all shrink-0 flex items-center gap-1"
            >
              <span>{game.name}</span>
            </a>
          ))}
        </div>
      )}

      {/* Primary Cyber Action Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {/* Wake-on-LAN Magic Packet Button */}
        <button
          onClick={() => onWake(rig)}
          disabled={isWaking}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all shadow-xl active:scale-95 ${
            isWaking
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 cursor-wait'
              : isOnline
              ? 'bg-[#1a1b23] hover:bg-[#252836] text-gray-200 border border-[#ffffff10]'
              : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/30'
          }`}
        >
          <Zap className={`w-4 h-4 ${isWaking ? 'animate-spin' : 'fill-current text-white'}`} />
          <span>{isWaking ? 'Dispatching...' : isOnline ? 'Send Magic Ping' : 'Wake Machine'}</span>
        </button>

        {/* Launch Parsec Integration Button */}
        <button
          onClick={() => {
            if (!isOnline) {
              onWake(rig);
            } else {
              onLaunchParsec(rig);
              onStartSession(rig);
            }
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all shadow-xl active:scale-95 ${
            isOnline
              ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-red-400/30'
              : 'bg-[#1a1b23] hover:bg-[#252836] text-gray-300 border border-[#ffffff10]'
          }`}
        >
          <MonitorPlay className="w-4 h-4" />
          <span>{isOnline ? 'Parsec Stream' : 'Wake & Stream'}</span>
        </button>
      </div>
    </div>
  );
};
