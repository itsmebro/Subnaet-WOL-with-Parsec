import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Cpu,
  MonitorPlay,
  Gamepad2,
  Tv,
  Laptop,
  Server,
  Monitor,
  Flame,
  Plus,
} from 'lucide-react';
import { GamingRig, WolStrategy, ParsecPreset, QuickGame } from '../types';
import { formatMacAddress, isValidMac, lookupVendor, calculateSubnetDetails } from '../services/subnetService';

interface RigModalProps {
  rig: GamingRig | null;
  onSave: (rig: GamingRig) => void;
  onDelete?: (rigId: string) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  '#4f46e5', // indigo
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
];

export const RigModal: React.FC<RigModalProps> = ({ rig, onSave, onDelete, onClose }) => {
  const isEditing = !!rig;

  const [name, setName] = useState(rig?.name || 'New Gaming Rig');
  const [icon, setIcon] = useState<GamingRig['icon']>(rig?.icon || 'desktop');
  const [color, setColor] = useState(rig?.color || '#4f46e5');
  const [mac, setMac] = useState(rig?.mac || '');
  const [targetIp, setTargetIp] = useState(rig?.targetIp || '192.168.1.100');
  const [subnetMask, setSubnetMask] = useState(rig?.subnetMask || '/24');
  const [customBroadcastIp, setCustomBroadcastIp] = useState(rig?.calculatedBroadcastIp || '');
  const [wolPort, setWolPort] = useState(rig?.wolPort || 9);
  const [secureOnPassword, setSecureOnPassword] = useState(rig?.secureOnPassword || '');
  const [strategy, setStrategy] = useState<WolStrategy>(rig?.strategy || 'directed_broadcast');
  const [relayEndpoint, setRelayEndpoint] = useState(rig?.relayEndpoint || '');
  const [relayToken, setRelayToken] = useState(rig?.relayToken || '');
  const [specSummary, setSpecSummary] = useState(rig?.specSummary || '');
  const [estimatedBootSeconds, setEstimatedBootSeconds] = useState(rig?.estimatedBootSeconds || 20);

  // Parsec settings
  const [parsecPeerId, setParsecPeerId] = useState(rig?.parsecPeerId || '');
  const [parsecShareLink, setParsecShareLink] = useState(rig?.parsecShareLink || '');
  const [parsecPreset, setParsecPreset] = useState<ParsecPreset>(
    rig?.parsecPreset || {
      resolution: '2560x1440',
      fps: 120,
      bitrateMbps: 50,
      decoder: 'H.265',
      colorFormat: '4:4:4',
      audioQuality: 'High',
      virtualDisplayEnabled: true,
      autoLaunchParsec: true,
    }
  );

  // Quick games
  const [quickGames, setQuickGames] = useState<QuickGame[]>(rig?.quickGames || []);
  const [newGameName, setNewGameName] = useState('');
  const [newGameAppId, setNewGameAppId] = useState('');

  // Auto-calculated fields
  const [vendor, setVendor] = useState('');
  const [calculatedBcast, setCalculatedBcast] = useState('');
  const [macError, setMacError] = useState('');

  useEffect(() => {
    if (mac) {
      const formatted = formatMacAddress(mac);
      setVendor(lookupVendor(formatted));
      if (!isValidMac(mac)) {
        setMacError('Incomplete MAC address (needs 12 hex chars)');
      } else {
        setMacError('');
      }
    } else {
      setVendor('');
      setMacError('');
    }
  }, [mac]);

  useEffect(() => {
    if (targetIp && subnetMask) {
      const calc = calculateSubnetDetails(targetIp, subnetMask);
      if (calc) {
        setCalculatedBcast(calc.broadcastIp);
      }
    }
  }, [targetIp, subnetMask]);

  const handleMacChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMacAddress(e.target.value);
    setMac(formatted);
  };

  const handleAddGame = () => {
    if (!newGameName.trim()) return;
    const newG: QuickGame = {
      id: `g_${Date.now()}`,
      name: newGameName.trim(),
      category: 'steam',
      appId: newGameAppId.trim() || undefined,
    };
    setQuickGames([...quickGames, newG]);
    setNewGameName('');
    setNewGameAppId('');
  };

  const handleRemoveGame = (id: string) => {
    setQuickGames(quickGames.filter((g) => g.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidMac(mac)) {
      setMacError('Please provide a valid 12-character MAC address.');
      return;
    }

    const updatedRig: GamingRig = {
      id: rig?.id || `rig_${Date.now()}`,
      name: name.trim() || 'My Gaming Rig',
      icon,
      color,
      mac: formatMacAddress(mac),
      targetIp: targetIp.trim(),
      subnetMask: subnetMask.trim(),
      calculatedBroadcastIp: customBroadcastIp.trim() || calculatedBcast,
      wolPort: Number(wolPort) || 9,
      secureOnPassword: secureOnPassword.trim() || undefined,
      strategy,
      relayEndpoint: relayEndpoint.trim() || undefined,
      relayToken: relayToken.trim() || undefined,
      parsecPeerId: parsecPeerId.trim() || undefined,
      parsecShareLink: parsecShareLink.trim() || undefined,
      parsecPreset,
      specSummary: specSummary.trim() || undefined,
      vendor: vendor || undefined,
      quickGames,
      status: rig?.status || 'offline',
      estimatedBootSeconds: Number(estimatedBootSeconds) || 20,
    };

    onSave(updatedRig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#050507]/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-lg my-6 rounded-3xl bg-gradient-to-br from-[#12141d] to-[#0a0a0e] border border-[#ffffff15] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ffffff10] bg-[#0a0a0e]/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg"
              style={{ backgroundColor: `${color}25`, color }}
            >
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                {isEditing ? 'Configure Gaming Rig' : 'Register New Gaming Host'}
              </h2>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-500">
                Network & Stream Parameters
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#1a1b23] border border-[#ffffff08] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {/* Rig Name & Icon & Color */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono mb-1.5">
              Host Rig Name & Identity
            </label>
            <div className="space-y-2.5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Titan-Desktop-01"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1a1b23] border border-[#ffffff10] text-white text-sm font-semibold focus:border-indigo-500/50 focus:outline-none"
              />

              {/* Icon selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Icon:</span>
                {(['desktop', 'laptop', 'server', 'tv', 'gamepad'] as const).map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`p-2 rounded-xl border text-xs transition-all ${
                      icon === ic
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                        : 'bg-[#1a1b23] border-[#ffffff08] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {ic === 'desktop' && <Monitor className="w-4 h-4" />}
                    {ic === 'laptop' && <Laptop className="w-4 h-4" />}
                    {ic === 'server' && <Server className="w-4 h-4" />}
                    {ic === 'tv' && <Tv className="w-4 h-4" />}
                    {ic === 'gamepad' && <Gamepad2 className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              {/* Color selector */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Theme:</span>
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0e]' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* MAC Address */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono mb-1.5 flex items-center justify-between">
              <span>Target NIC MAC Address</span>
              {vendor && <span className="text-[10px] text-indigo-400 font-mono font-semibold">{vendor}</span>}
            </label>
            <input
              type="text"
              value={mac}
              onChange={handleMacChange}
              placeholder="3C:7C:3F:8A:2B:19"
              required
              className={`w-full px-3.5 py-2.5 rounded-2xl bg-[#1a1b23] border font-mono text-xs uppercase text-white focus:outline-none ${
                macError ? 'border-rose-500' : 'border-[#ffffff10] focus:border-indigo-500/50'
              }`}
            />
            {macError && <p className="text-[11px] text-rose-400 mt-1 font-mono">{macError}</p>}
            <p className="text-[10px] text-gray-500 mt-1 font-mono">
              Find in PowerShell: <code className="text-indigo-400">getmac /v</code> or Linux: <code className="text-indigo-400">ip link</code>
            </p>
          </div>

          {/* Cross-Subnet Strategy Selector */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono mb-1.5">
              Cross-Subnet WoL Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as WolStrategy)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1a1b23] border border-[#ffffff10] text-white text-xs font-mono focus:border-indigo-500/50 focus:outline-none"
            >
              <option value="directed_broadcast">Subnet Directed Broadcast (e.g. 192.168.1.255)</option>
              <option value="relay_agent">Subnet Relay Daemon (Raspberry Pi / NAS / Home Assistant)</option>
              <option value="tailscale_vpn">Tailscale / WireGuard Subnet Router (Mesh VPN)</option>
              <option value="wan_port_forward">Router Port Forwarding / DDNS (NAT UDP 9)</option>
              <option value="ssh_bridge">SSH Command Bridge (Router Script)</option>
            </select>
          </div>

          {/* Network IP & Subnet Mask */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Host Target IP
              </label>
              <input
                type="text"
                value={targetIp}
                onChange={(e) => setTargetIp(e.target.value)}
                placeholder="192.168.1.150"
                required
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] font-mono text-xs text-white focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Subnet Mask / CIDR
              </label>
              <input
                type="text"
                value={subnetMask}
                onChange={(e) => setSubnetMask(e.target.value)}
                placeholder="/24 or 255.255.255.0"
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] font-mono text-xs text-white focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Subnet Auto-Calculation Preview */}
          {calculatedBcast && (
            <div className="p-3 rounded-2xl bg-[#00000040] border border-[#ffffff08] flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400 text-[11px]">Computed Broadcast IP:</span>
              <span className="text-indigo-400 font-bold">{calculatedBcast}</span>
            </div>
          )}

          {/* Relay Endpoint (if relay_agent selected) */}
          {strategy === 'relay_agent' && (
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
              <span className="text-xs font-bold text-purple-300 font-mono uppercase">Local Relay Agent Settings</span>
              <input
                type="text"
                value={relayEndpoint}
                onChange={(e) => setRelayEndpoint(e.target.value)}
                placeholder="http://192.168.1.5:8088/wol"
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
              />
              <input
                type="password"
                value={relayToken}
                onChange={(e) => setRelayToken(e.target.value)}
                placeholder="Bearer Auth Token (Optional)"
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          )}

          {/* WoL Port & SecureOn */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                WoL Port (Default: 9)
              </label>
              <input
                type="number"
                value={wolPort}
                onChange={(e) => setWolPort(Number(e.target.value))}
                placeholder="9"
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] font-mono text-xs text-white focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                SecureOn PWD (Hex)
              </label>
              <input
                type="text"
                value={secureOnPassword}
                onChange={(e) => setSecureOnPassword(e.target.value)}
                placeholder="AA:BB:CC:DD:EE:FF"
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] font-mono text-xs text-white focus:border-indigo-500/50 focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* Parsec Integration Settings */}
          <div className="p-4 rounded-3xl bg-[#0f1016] border border-[#ffffff08] space-y-3">
            <div className="flex items-center gap-2">
              <MonitorPlay className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Parsec Stream Tuning
              </span>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Parsec Peer ID / Server ID
              </label>
              <input
                type="text"
                value={parsecPeerId}
                onChange={(e) => setParsecPeerId(e.target.value)}
                placeholder="e.g. your Parsec Computer ID"
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Resolution & FPS */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">Resolution</label>
                <select
                  value={parsecPreset.resolution}
                  onChange={(e) =>
                    setParsecPreset({
                      ...parsecPreset,
                      resolution: e.target.value as ParsecPreset['resolution'],
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-xs font-mono text-gray-200 focus:outline-none"
                >
                  <option value="1920x1080">1080p (1920x1080)</option>
                  <option value="2560x1440">1440p 2K (2560x1440)</option>
                  <option value="3840x2160">4K UHD (3840x2160)</option>
                  <option value="3440x1440">Ultrawide (3440x1440)</option>
                  <option value="2400x1080">Mobile 20:9 (2400x1080)</option>
                  <option value="1280x800">Steam Deck (1280x800)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">FPS Target</label>
                <select
                  value={parsecPreset.fps}
                  onChange={(e) =>
                    setParsecPreset({
                      ...parsecPreset,
                      fps: Number(e.target.value) as ParsecPreset['fps'],
                    })
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-xs font-mono text-gray-200 focus:outline-none"
                >
                  <option value="60">60 FPS (Standard)</option>
                  <option value="120">120 FPS (Smooth)</option>
                  <option value="144">144 FPS (Competitive)</option>
                  <option value="240">240 FPS (Esports)</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer font-mono">
                <input
                  type="checkbox"
                  checked={parsecPreset.autoLaunchParsec}
                  onChange={(e) =>
                    setParsecPreset({
                      ...parsecPreset,
                      autoLaunchParsec: e.target.checked,
                    })
                  }
                  className="rounded border-[#ffffff15] bg-[#1a1b23] text-indigo-600 focus:ring-0"
                />
                <span className="text-[11px]">Auto-launch on boot</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer font-mono">
                <input
                  type="checkbox"
                  checked={parsecPreset.virtualDisplayEnabled}
                  onChange={(e) =>
                    setParsecPreset({
                      ...parsecPreset,
                      virtualDisplayEnabled: e.target.checked,
                    })
                  }
                  className="rounded border-[#ffffff15] bg-[#1a1b23] text-indigo-600 focus:ring-0"
                />
                <span className="text-[11px]">Virtual Display</span>
              </label>
            </div>
          </div>

          {/* Hardware Specs summary */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono mb-1.5">
              Rig Specs Summary
            </label>
            <input
              type="text"
              value={specSummary}
              onChange={(e) => setSpecSummary(e.target.value)}
              placeholder="e.g. Ryzen 7 7800X3D • RTX 4090 • 64GB DDR5"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#1a1b23] border border-[#ffffff10] text-xs font-mono text-white focus:border-indigo-500/50 focus:outline-none"
            />
          </div>

          {/* Quick Games List */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Quick Launch Shortcuts
              </span>
            </label>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1a1b23] border border-[#ffffff08] text-xs text-gray-200"
                >
                  <span>{game.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGame(game.id)}
                    className="text-gray-500 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Game Name (e.g. Cyberpunk 2077)"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-xs text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Steam AppID"
                value={newGameAppId}
                onChange={(e) => setNewGameAppId(e.target.value)}
                className="w-28 px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-xs font-mono text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddGame}
                className="p-2.5 rounded-xl bg-[#1a1b23] hover:bg-[#252836] border border-[#ffffff10] text-indigo-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#ffffff10] flex items-center justify-between">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete ${name}?`)) {
                    onDelete(rig.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-950/40 transition-colors font-mono"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-[#1a1b23] hover:bg-[#252836] text-gray-300 text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all active:scale-95 border border-indigo-400/30"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
