import React, { useState } from 'react';
import {
  MonitorPlay,
  Sliders,
  Tv,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { GamingRig, ParsecPreset } from '../types';
import {
  generateParsecConfig,
  generateVirtualDisplayScript,
  generateAutoLoginGuide,
  getParsecWebUrl,
  launchParsecSession,
} from '../services/parsecService';

interface ParsecViewProps {
  rigs: GamingRig[];
  onStartSession: (rig: GamingRig) => void;
  onUpdateRigPreset: (rigId: string, preset: ParsecPreset) => void;
}

export const ParsecView: React.FC<ParsecViewProps> = ({
  rigs,
  onStartSession,
  onUpdateRigPreset,
}) => {
  const [selectedRigId, setSelectedRigId] = useState<string>(rigs[0]?.id || '');
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);

  const selectedRig = rigs.find((r) => r.id === selectedRigId) || rigs[0];
  const preset = selectedRig?.parsecPreset || {
    resolution: '2560x1440',
    fps: 120,
    bitrateMbps: 50,
    decoder: 'H.265',
    colorFormat: '4:4:4',
    audioQuality: 'High',
    virtualDisplayEnabled: true,
    autoLaunchParsec: true,
  };

  const handlePresetChange = (updates: Partial<ParsecPreset>) => {
    if (!selectedRig) return;
    const newPreset = { ...preset, ...updates };
    onUpdateRigPreset(selectedRig.id, newPreset);
  };

  const copyConfigTxt = () => {
    const text = generateParsecConfig(preset);
    navigator.clipboard.writeText(text);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const copyVirtualDisplay = () => {
    if (!selectedRig) return;
    const text = generateVirtualDisplayScript(selectedRig.name);
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const copyLoginGuide = () => {
    const text = generateAutoLoginGuide();
    navigator.clipboard.writeText(text);
    setCopiedLogin(true);
    setTimeout(() => setCopiedLogin(false), 2000);
  };

  if (!selectedRig) {
    return (
      <div className="text-center py-16 text-gray-400">
        <MonitorPlay className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p className="text-sm font-mono">No gaming rigs configured. Add a rig in the Rigs tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28 max-w-xl mx-auto">
      {/* Top Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#12141d] to-[#0a0a0e] border border-[#ffffff10] p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-400/30">
            <MonitorPlay className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">
              Parsec Gaming Control Hub
            </h2>
            <p className="text-xs text-indigo-300 font-mono">
              Ultra-low latency 60-240 FPS remote desktop pipeline
            </p>
          </div>
        </div>

        {/* Rig Switcher */}
        <div className="mt-4">
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono mb-1.5">
            Active Remote Host
          </label>
          <select
            value={selectedRig.id}
            onChange={(e) => setSelectedRigId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1a1b23] border border-[#ffffff10] text-white text-xs font-semibold focus:outline-none focus:border-indigo-500/50"
          >
            {rigs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.targetIp}) {r.parsecPeerId ? `• ID: ${r.parsecPeerId}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Launch Parsec Button */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              launchParsecSession(selectedRig);
              onStartSession(selectedRig);
            }}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95 transition-all border border-red-400/30"
          >
            <MonitorPlay className="w-4 h-4" />
            <span>Launch Parsec</span>
          </button>

          <a
            href={getParsecWebUrl(selectedRig)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#1a1b23] hover:bg-[#252836] text-gray-200 border border-[#ffffff10] font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Web Client</span>
          </a>
        </div>
      </div>

      {/* Stream Tuning & Settings */}
      <div className="rounded-3xl bg-[#0f1016] border border-[#ffffff08] p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Stream Performance Tuner
          </h3>
        </div>

        {/* Resolution selector */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono mb-2">
            Target Display Resolution
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '1920x1080', label: '1080p FHD' },
              { id: '2560x1440', label: '1440p 2K' },
              { id: '3840x2160', label: '4K UHD' },
              { id: '3440x1440', label: 'Ultrawide' },
              { id: '2400x1080', label: 'Phone 20:9' },
              { id: '1280x800', label: 'Steam Deck' },
            ].map((res) => (
              <button
                key={res.id}
                onClick={() =>
                  handlePresetChange({ resolution: res.id as ParsecPreset['resolution'] })
                }
                className={`py-2 px-2.5 rounded-xl text-xs font-mono transition-all border ${
                  preset.resolution === res.id
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold shadow-[0_0_12px_rgba(79,70,229,0.3)]'
                    : 'bg-[#1a1b23] border-[#ffffff08] text-gray-400 hover:text-gray-200'
                }`}
              >
                {res.label}
              </button>
            ))}
          </div>
        </div>

        {/* Framerate & Bitrate */}
        <div className="space-y-3.5 pt-1">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono">
                Bitrate Bandwidth
              </span>
              <span className="font-mono text-indigo-400 font-bold">{preset.bitrateMbps} Mbps</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={preset.bitrateMbps}
              onChange={(e) => handlePresetChange({ bitrateMbps: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>10 Mbps (5G / Cell)</span>
              <span>50 Mbps (Balanced)</span>
              <span>100 Mbps (LAN / Fiber)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-mono mb-1">
                Target FPS
              </label>
              <select
                value={preset.fps}
                onChange={(e) => handlePresetChange({ fps: Number(e.target.value) as ParsecPreset['fps'] })}
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-xs font-mono text-white focus:outline-none focus:border-indigo-500/40"
              >
                <option value={60}>60 FPS</option>
                <option value={120}>120 FPS (High-Hz)</option>
                <option value={144}>144 FPS (Esports)</option>
                <option value={240}>240 FPS (Max)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-mono mb-1">
                Video Decoder
              </label>
              <select
                value={preset.decoder}
                onChange={(e) => handlePresetChange({ decoder: e.target.value as ParsecPreset['decoder'] })}
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-xs font-mono text-white focus:outline-none focus:border-indigo-500/40"
              >
                <option value="H.265">H.265 / HEVC</option>
                <option value="AV1">AV1 (RTX 40 / ARC)</option>
                <option value="H.264">H.264 (Legacy)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Color 4:4:4 and Audio Quality */}
        <div className="pt-3 border-t border-[#ffffff08] flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={preset.colorFormat === '4:4:4'}
              onChange={(e) =>
                handlePresetChange({ colorFormat: e.target.checked ? '4:4:4' : '4:2:0' })
              }
              className="rounded bg-[#1a1b23] border-[#ffffff15] text-indigo-600 focus:ring-0"
            />
            <span className="text-xs font-mono text-gray-300">4:4:4 Crisp Text Mode</span>
          </label>

          <button
            onClick={copyConfigTxt}
            className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl font-mono transition-colors"
          >
            {copiedConfig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedConfig ? 'Copied config.txt' : 'Copy config.txt'}</span>
          </button>
        </div>
      </div>

      {/* Headless Gaming / Virtual Display Helper */}
      <div className="rounded-3xl bg-[#0f1016] border border-[#ffffff08] p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <Tv className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Headless Gaming & Virtual Display
          </h3>
        </div>
        <p className="text-xs text-gray-400 font-mono">
          When turning off physical monitors or waking PCs remotely, Windows may disable GPU output causing a black screen in Parsec.
        </p>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1a1b23] border border-[#ffffff08] text-xs">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-purple-400" />
              <div>
                <span className="font-semibold text-white block">Virtual Display PowerShell Driver</span>
                <span className="text-[11px] text-gray-400 font-mono">Enables Parsec Virtual Display driver</span>
              </div>
            </div>
            <button
              onClick={copyVirtualDisplay}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-mono transition-colors flex items-center gap-1"
            >
              {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1a1b23] border border-[#ffffff08] text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-semibold text-white block">Windows Auto-Login Setup</span>
                <span className="text-[11px] text-gray-400 font-mono">Boot directly into desktop on WoL</span>
              </div>
            </div>
            <button
              onClick={copyLoginGuide}
              className="px-3 py-1.5 rounded-xl bg-[#0f1016] border border-[#ffffff10] text-gray-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1"
            >
              {copiedLogin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLogin ? 'Copied' : 'Copy Guide'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
